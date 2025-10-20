import { Controller, Get, Post, Body, Param, ParseIntPipe, UseGuards, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { AiService } from '../ai/ai.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { TelegramGuard } from '../telegram-auth/telegram.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import * as path from 'path';
let pdfParse: any;

@Controller('chats')
@UseGuards(TelegramGuard)
export class ChatsController {
  constructor(
    private readonly chatsService: ChatsService,
    private readonly aiService: AiService,
  ) {}

  @Post()
  async create(@Body() createChatDto: CreateChatDto) {
    return this.chatsService.create(createChatDto);
  }

  @Get(':userId')
  async findByUserId(@Param('userId', ParseIntPipe) userId: number) {
    return this.chatsService.findByUserId(userId);
  }

  @Get(':chatId/messages')
  async getMessages(@Param('chatId', ParseIntPipe) chatId: number) {
    return this.chatsService.getMessages(chatId);
  }

  @Post('messages')
  async sendMessage(@Body() sendMessageDto: SendMessageDto) {
    const { chatId, message, systemPrompt, temperature, maxTokens } = sendMessageDto;

    // Save user message
    await this.chatsService.addMessage(chatId, 'user', message);

    // Get chat history
    const chat = await this.chatsService.findOne(chatId);
    
    // Get AI response
    const aiResponse = await this.aiService.chat(chat.messages, {
      systemPrompt,
      temperature,
      maxTokens,
    });

    // Save AI message
    await this.chatsService.addMessage(chatId, 'assistant', aiResponse);

    return {
      message: aiResponse,
    };
  }

  @Post(':chatId/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const dest = path.join(process.cwd(), 'uploads');
          if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
          cb(null, dest);
        },
        filename: (req, file, cb) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, unique + '-' + file.originalname);
        },
      }),
      limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
    }),
  )
  async uploadFile(
    @Param('chatId', ParseIntPipe) chatId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      return { message: 'No file uploaded' };
    }

    const ext = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype;
    let extractedText = '';

    try {
      if (mime.startsWith('text/') || ['.txt', '.md', '.csv', '.log'].includes(ext)) {
        extractedText = fs.readFileSync(file.path, 'utf-8');
      } else if (mime === 'application/json' || ext === '.json') {
        const json = JSON.parse(fs.readFileSync(file.path, 'utf-8'));
        extractedText = JSON.stringify(json, null, 2).slice(0, 15000);
      } else if (mime === 'application/pdf' || ext === '.pdf') {
        if (!pdfParse) {
          try {
            // Lazy require to avoid startup penalty
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            pdfParse = require('pdf-parse');
          } catch (e) {
            pdfParse = null;
          }
        }
        if (pdfParse) {
          const dataBuffer = fs.readFileSync(file.path);
          const result = await pdfParse(dataBuffer);
          extractedText = (result.text || '').slice(0, 15000);
        } else {
          extractedText = `[PDF uploaded: ${file.originalname}, unable to parse on server]`;
        }
      } else if (mime.startsWith('audio/')) {
        // Transcribe via OpenAI Whisper if available
        try {
          const chat = await this.chatsService.findOne(chatId);
          // @ts-ignore access openai
          const openai: any = (this.aiService as any).openai;
          if (openai?.audio?.transcriptions) {
            const stream = fs.createReadStream(file.path);
            const transcription = await openai.audio.transcriptions.create({
              model: 'whisper-1',
              file: stream as any,
            });
            extractedText = transcription.text || '';
          } else {
            extractedText = '[Audio uploaded but transcription service not available]';
          }
        } catch (e) {
          extractedText = '[Audio uploaded but transcription failed]';
        }
      } else {
        extractedText = `[File uploaded: ${file.originalname}, type: ${mime}, size: ${file.size} bytes]`;
      }

      const userMessage = `File: ${file.originalname}\n\n${extractedText}`.slice(0, 16000);

      // Save user message with extracted content
      await this.chatsService.addMessage(chatId, 'user', userMessage);

      // Get updated chat history
      const chat = await this.chatsService.findOne(chatId);

      // Ask AI with the new context
      const aiResponse = await this.aiService.chat(chat.messages);

      await this.chatsService.addMessage(chatId, 'assistant', aiResponse);

      return { message: aiResponse };
    } finally {
      // Optionally keep files; here we keep the uploaded file for auditing
    }
  }
}

