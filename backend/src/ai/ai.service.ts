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
    const fallback = parseFloat(this.configService.get<string>('OPENAI_TEMPERATURE') || '0.7');
    if (typeof temperature !== 'number' || isNaN(temperature)) return fallback;
    if (temperature < 0) return 0;
    if (temperature > 2) return 2;
    return temperature;
  }

  private sanitizeMaxTokens(maxTokens?: number): number {
    const fallback = parseInt(this.configService.get<string>('OPENAI_MAX_TOKENS') || '1000', 10);
    if (typeof maxTokens !== 'number' || isNaN(maxTokens)) return fallback;
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
    options?: { systemPrompt?: string; temperature?: number; maxTokens?: number; model?: string },
  ): Promise<string> {
    if (!this.openai) {
      throw new Error('OpenAI is not configured. Please set OPENAI_API_KEY in environment variables.');
    }

    try {
      const defaultModel = this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o';
      const model = options?.model || defaultModel;
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

  async chatWithImage(
    messages: Array<{ role: string; content: string }>,
    imageUrl: string,
    prompt: string,
    modelOverride?: string,
  ): Promise<string> {
    if (!this.openai) {
      throw new Error('OpenAI is not configured. Please set OPENAI_API_KEY in environment variables.');
    }

    try {
      // Use vision-capable model (gpt-4o or gpt-4-vision-preview)
      const model = modelOverride && modelOverride.includes('4o') ? modelOverride : 'gpt-4o';
      const temperature = this.sanitizeTemperature(0.7);
      const max_tokens = this.sanitizeMaxTokens(1000);

      // Build messages with image
      const visionMessages = [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        },
      ];

      const completion = await this.openai.chat.completions.create({
        model,
        messages: visionMessages as any,
        temperature,
        max_tokens,
      });

      return completion.choices[0].message.content;
    } catch (error) {
      const message = (error as any)?.message || 'Unknown OpenAI error';
      this.logger.error(`Error in AI vision: ${message}`);
      throw new Error(`AI vision error: ${message}`);
    }
  }
}

