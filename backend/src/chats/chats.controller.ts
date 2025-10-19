import { Controller, Get, Post, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { AiService } from '../ai/ai.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { TelegramGuard } from '../telegram-auth/telegram.guard';

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
}

