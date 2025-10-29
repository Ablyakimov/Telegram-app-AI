import { Controller, Get, Post, Body, Param, ParseIntPipe, UseGuards, UploadedFile, UseInterceptors, Req, Patch, Delete, BadRequestException } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { AiService } from '../ai/ai.service';
import { DedupCacheService } from './dedup-cache.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { TelegramGuard } from '../telegram-auth/telegram.guard';
import { UsersService } from '../users/users.service';
import { SubscriptionService } from '../users/subscription.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import { Request } from 'express';
let pdfParse: any;

@Controller('chats')
@UseGuards(TelegramGuard)
export class ChatsController {
  constructor(
    private readonly chatsService: ChatsService,
    private readonly aiService: AiService,
    private readonly usersService: UsersService,
    private readonly subscriptionService: SubscriptionService,
    private readonly dedupCache: DedupCacheService,
  ) {}

  @Post()
  async create(@Body() createChatDto: CreateChatDto, @Req() req: Request) {
    // Get user from Telegram auth
    const telegramUser = req['telegramUser'];
    
    if (telegramUser) {
      // Ensure user exists in database (or reuse by username)
      const dbUser = await this.usersService.findOrCreate({
        id: telegramUser.id,
        username: telegramUser.username || null,
        firstName: telegramUser.first_name || '',
      });
      
      // Use actual DB user id to avoid FK violations
      createChatDto.userId = dbUser.id;

      // Check subscription and model access before creating chat using the same user id
      const model = createChatDto.aiModel || 'gpt-3.5-turbo';
      const accessCheck = await this.subscriptionService.checkAccess(dbUser.id, model);
      
      if (!accessCheck.allowed) {
        let errorMessage = 'Access denied';
        
        if (accessCheck.reason === 'model_not_allowed') {
          errorMessage = `Model ${model} is not available on your current plan. Please upgrade to PRO or select GPT-3.5.`;
        }
        
        throw new BadRequestException({
          message: errorMessage,
          reason: accessCheck.reason,
          subscription: accessCheck.subscription,
        });
      }
    }
    
    const chat = await this.chatsService.create(createChatDto);
    // If systemPrompt provided, seed assistant's first reply using selected model
    const seedPrompt = (createChatDto.systemPrompt || '').trim();
    if (seedPrompt) {
      try {
        const aiResponse = await this.aiService.chat([], {
          systemPrompt: seedPrompt,
          model: chat.aiModel,
        });
        await this.chatsService.addMessage(chat.id, 'assistant', aiResponse);
      } catch (e) {
        // do not fail creation on AI seed error
        console.error('Seed assistant error:', (e as any)?.message || e);
      }
    }
    // Return fresh chat
    return this.chatsService.findOne(chat.id);
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
  async sendMessage(@Body() sendMessageDto: SendMessageDto, @Req() req: Request) {
    const { chatId, message, systemPrompt, temperature, maxTokens } = sendMessageDto;
    const telegramUser = req['telegramUser'];

    // Get chat to check model
    const chat = await this.chatsService.findOne(chatId);
    
    // Get subscription to check message length limits
    const subscription = await this.subscriptionService.getSubscription(telegramUser.id);
    const isPro = subscription.plan === 'pro' && subscription.expiresAt && new Date(subscription.expiresAt) > new Date();
    
    // Check message length limits
    const maxMessageLength = isPro ? 4000 : 500;
    if (message.length > maxMessageLength) {
      throw new BadRequestException({
        message: `Message too long. Maximum ${maxMessageLength} characters allowed for your plan.`,
        reason: 'message_too_long',
        maxLength: maxMessageLength,
        currentLength: message.length,
      });
    }

    // Check for duplicate messages (deduplication)
    if (this.dedupCache.isDuplicate(telegramUser.id, chatId, message)) {
      throw new BadRequestException({
        message: 'Duplicate message detected. Please wait a moment before sending the same message again.',
        reason: 'duplicate_message',
      });
    }

    // Check access and limits
    const accessCheck = await this.subscriptionService.checkAccess(telegramUser.id, chat.aiModel);
    
    if (!accessCheck.allowed) {
      let errorMessage = 'Access denied';
      
      if (accessCheck.reason === 'subscription_expired') {
        errorMessage = 'Your subscription has expired. Please upgrade to continue.';
      } else if (accessCheck.reason === 'model_not_allowed') {
        errorMessage = 'This model is not available on your current plan. Please upgrade to PRO.';
      } else if (accessCheck.reason === 'monthly_limit_reached') {
        errorMessage = 'Monthly message limit reached. Please buy credits or upgrade to PRO.';
      }
      
      throw new BadRequestException({
        message: errorMessage,
        reason: accessCheck.reason,
        subscription: accessCheck.subscription,
      });
    }

    // Add message to dedup cache
    this.dedupCache.add(telegramUser.id, chatId, message);

    // Save user message and get updated chat with new message
    const updatedChat = await this.chatsService.addMessage(chatId, 'user', message);
    
    // Limit context size based on subscription
    const contextLimit = isPro ? 50 : 10;
    const recentMessages = updatedChat.messages.slice(-contextLimit);
    
    // Get AI response with limited context
    const aiResponse = await this.aiService.chat(recentMessages, {
      systemPrompt,
      temperature,
      maxTokens: isPro ? (maxTokens || 2000) : Math.min(maxTokens || 500, 500), // Limit maxTokens for FREE
      model: chat.aiModel,
    });

    // Save AI message
    await this.chatsService.addMessage(chatId, 'assistant', aiResponse);

    // Deduct usage (credits or increment counter)
    await this.subscriptionService.deductUsage(telegramUser.id, chat.aiModel, 0);

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

    // Decode filename properly (handle cyrillic and other encodings)
    const fileName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const ext = path.extname(fileName).toLowerCase();
    const mime = file.mimetype;
    let extractedText = '';
    
    console.log('📎 File upload:', {
      original: file.originalname,
      decoded: fileName,
      mime,
      size: file.size
    });

    try {
      if (mime.startsWith('text/') || ['.txt', '.md', '.csv', '.log'].includes(ext)) {
        const fileContent = fs.readFileSync(file.path, 'utf-8');
        // Save user message with just file name
        const userMessage = `📄 Файл: ${fileName}`;
        await this.chatsService.addMessage(chatId, 'user', userMessage);
        
        // Get chat history
        const chat = await this.chatsService.findOne(chatId);
        
        // Ask AI with file content in context
        const contextMessage = `Пользователь отправил файл "${fileName}" с содержимым:\n\n${fileContent.slice(0, 15000)}`;
        const aiResponse = await this.aiService.chat([
          ...chat.messages,
          { role: 'user', content: contextMessage }
        ], { model: chat.aiModel });
        
        await this.chatsService.addMessage(chatId, 'assistant', aiResponse);
        
        return { message: aiResponse };
      } else if (mime === 'application/json' || ext === '.json') {
        const json = JSON.parse(fs.readFileSync(file.path, 'utf-8'));
        const fileContent = JSON.stringify(json, null, 2).slice(0, 15000);
        
        // Save user message with just file name
        const userMessage = `📄 Файл: ${fileName}`;
        await this.chatsService.addMessage(chatId, 'user', userMessage);
        
        // Get chat history
        const chat = await this.chatsService.findOne(chatId);
        
        // Ask AI with file content in context
        const contextMessage = `Пользователь отправил JSON файл "${fileName}" с содержимым:\n\n${fileContent}`;
        const aiResponse = await this.aiService.chat([
          ...chat.messages,
          { role: 'user', content: contextMessage }
        ], { model: chat.aiModel });
        
        await this.chatsService.addMessage(chatId, 'assistant', aiResponse);
        
        return { message: aiResponse };
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
        
        let pdfContent = '';
        if (pdfParse) {
          const dataBuffer = fs.readFileSync(file.path);
          const result = await pdfParse(dataBuffer);
          pdfContent = (result.text || '').slice(0, 15000);
        } else {
          pdfContent = '[PDF uploaded but unable to parse]';
        }
        
        // Save user message with just file name
        const userMessage = `📄 PDF: ${fileName}`;
        await this.chatsService.addMessage(chatId, 'user', userMessage);
        
        // Get chat history
        const chat = await this.chatsService.findOne(chatId);
        
        // Ask AI with file content in context
        const contextMessage = `Пользователь отправил PDF файл "${fileName}" с содержимым:\n\n${pdfContent}`;
        const aiResponse = await this.aiService.chat([
          ...chat.messages,
          { role: 'user', content: contextMessage }
        ], { model: chat.aiModel });
        
        await this.chatsService.addMessage(chatId, 'assistant', aiResponse);
        
        return { message: aiResponse };
      } else if (mime.startsWith('audio/')) {
        // Transcribe via OpenAI Whisper if available
        try {
          // @ts-ignore access openai
          const openai: any = (this.aiService as any).openai;
          if (openai?.audio?.transcriptions) {
            const stream = fs.createReadStream(file.path);
            const transcription = await openai.audio.transcriptions.create({
              model: 'whisper-1',
              file: stream as any,
            });
            const transcribedText = transcription.text || '';
            console.log('Transcription successful:', transcribedText);
            
            // Save only transcribed text as user message (without "File: voice.webm")
            await this.chatsService.addMessage(chatId, 'user', transcribedText);
            
            // Get chat history
            const chat = await this.chatsService.findOne(chatId);
            
            // Ask AI with the transcribed text
            const aiResponse = await this.aiService.chat(chat.messages, { model: chat.aiModel });
            
            await this.chatsService.addMessage(chatId, 'assistant', aiResponse);
            
            return { message: aiResponse };
          } else {
            console.log('OpenAI transcription service not available');
            extractedText = '[Audio uploaded but transcription service not available]';
          }
        } catch (e) {
          console.error('Audio transcription error:', e);
          extractedText = `[Audio uploaded but transcription failed: ${e.message}]`;
        }
      } else if (mime.startsWith('image/')) {
        try {
          console.log('🖼️ Processing image:', fileName, 'mime:', mime, 'size:', file.size);
          
          // Convert image to base64
          const imageBuffer = fs.readFileSync(file.path);
          const base64Image = imageBuffer.toString('base64');
          const imageUrl = `data:${mime};base64,${base64Image}`;
          
          console.log('✅ Image converted to base64, length:', base64Image.length);
          
          // Save message with image reference
          const userMessage = `🖼️ Изображение: ${fileName}`;
          await this.chatsService.addMessage(chatId, 'user', userMessage);
          
          console.log('✅ User message saved');
          
          // Get chat history
          const chat = await this.chatsService.findOne(chatId);
          
          console.log('✅ Chat history loaded, message count:', chat.messages.length);
          
          // Ask AI about the image using vision with context
          console.log('🤖 Calling OpenAI Vision API...');
          const aiResponse = await this.aiService.chatWithImage(
            chat.messages, 
            imageUrl, 
            'Опиши что ты видишь на этом изображении',
            chat.aiModel
          );
          
          console.log('✅ AI response received, length:', aiResponse?.length);
          
          await this.chatsService.addMessage(chatId, 'assistant', aiResponse);
          
          console.log('✅ AI message saved');
          
          return { message: aiResponse };
        } catch (error) {
          console.error('❌ Image processing error:', error);
          console.error('Error stack:', error?.stack);
          const errorMessage = error?.message || 'Unknown error';
          throw new Error(`Failed to process image: ${errorMessage}`);
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
      const aiResponse = await this.aiService.chat(chat.messages, { model: chat.aiModel });

      await this.chatsService.addMessage(chatId, 'assistant', aiResponse);

      return { message: aiResponse };
    } finally {
      // Optionally keep files; here we keep the uploaded file for auditing
    }
  }

  @Patch(':chatId')
  async updateChat(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Body() updateChatDto: UpdateChatDto,
    @Req() req: Request,
  ) {
    const telegramUser = req['telegramUser'];
    const userId = telegramUser?.id;
    
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    return this.chatsService.updateName(chatId, updateChatDto.name, userId);
  }

  @Delete(':chatId')
  async deleteChat(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Req() req: Request,
  ) {
    const telegramUser = req['telegramUser'];
    const userId = telegramUser?.id;
    
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    await this.chatsService.remove(chatId, userId);
    return { message: 'Chat deleted successfully' };
  }
}

