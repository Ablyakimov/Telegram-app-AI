import { Controller, Post, Body } from '@nestjs/common';
import { AiService } from './ai.service';
import { ChatRequestDto } from './dto/chat-request.dto';
import { ChatResponseDto } from './dto/chat-response.dto';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  async chat(@Body() chatRequestDto: ChatRequestDto): Promise<ChatResponseDto> {
    const response = await this.aiService.chat(chatRequestDto.messages, {
      systemPrompt: chatRequestDto.systemPrompt,
      temperature: chatRequestDto.temperature,
      maxTokens: chatRequestDto.maxTokens,
    });

    return {
      message: response,
    };
  }
}
