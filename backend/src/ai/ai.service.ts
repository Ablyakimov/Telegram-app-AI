import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    
    if (!apiKey) {
      this.logger.warn('OpenAI API key not configured. AI features will not work.');
    } else {
      this.openai = new OpenAI({
        apiKey: apiKey,
      });
    }
  }

  private sanitizeTemperature(temperature?: number): number {
    const fallback = this.configService.get<number>('OPENAI_TEMPERATURE') ?? 0.7;
    if (typeof temperature !== 'number') return fallback;
    if (temperature < 0) return 0;
    if (temperature > 2) return 2;
    return temperature;
  }

  private sanitizeMaxTokens(maxTokens?: number): number {
    const fallback = this.configService.get<number>('OPENAI_MAX_TOKENS') ?? 1000;
    if (typeof maxTokens !== 'number') return fallback;
    if (maxTokens < 1) return 1;
    if (maxTokens > 4000) return 4000; // guardrail
    return maxTokens;
  }

  private buildMessages(
    contextMessages: Array<{ role: string; content: string }>,
    systemPrompt?: string,
    approxContextCharLimit = 15000,
  ) {
    // Trim context by total characters (rough proxy to keep requests bounded)
    let total = 0;
    const trimmed: Array<{ role: string; content: string }> = [];
    for (let i = contextMessages.length - 1; i >= 0; i--) {
      const msg = contextMessages[i];
      const len = (msg.content || '').length;
      if (total + len > approxContextCharLimit && trimmed.length > 0) break;
      total += len;
      trimmed.push(msg);
    }
    trimmed.reverse();

    const sys =
      systemPrompt ||
      'You are a helpful AI assistant in a Telegram Mini App. Be concise and friendly.';

    return [
      { role: 'system', content: sys },
      ...trimmed,
    ] as Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  }

  async chat(
    messages: Array<{ role: string; content: string }>,
    options?: { systemPrompt?: string; temperature?: number; maxTokens?: number },
  ): Promise<string> {
    if (!this.openai) {
      throw new Error('OpenAI is not configured. Please set OPENAI_API_KEY in environment variables.');
    }

    try {
      const model = this.configService.get<string>('OPENAI_MODEL') || 'gpt-4';
      const temperature = this.sanitizeTemperature(options?.temperature);
      const max_tokens = this.sanitizeMaxTokens(options?.maxTokens);

      const builtMessages = this.buildMessages(messages, options?.systemPrompt);

      const completion = await this.openai.chat.completions.create({
        model,
        messages: builtMessages as any,
        temperature,
        max_tokens,
      });

      return completion.choices[0].message.content;
    } catch (error) {
      const message = (error as any)?.message || 'Unknown OpenAI error';
      this.logger.error(`Error in AI chat: ${message}`);
      throw new Error(`AI chat error: ${message}`);
    }
  }
}

