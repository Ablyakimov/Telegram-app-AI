import { Controller, Get } from '@nestjs/common';

@Controller('ai/models')
export class ModelsController {
  @Get()
  findAll() {
    // Available models configuration (OpenAI for now). Others are placeholders.
    return [
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        provider: 'openai',
        icon: '🚀',
        supportsVision: false,
        supportsAudio: false,
        enabled: true,
        recommended: true,
        note: 'Быстрый и дешевый по умолчанию',
      },
      {
        id: 'gpt-3.5-turbo-16k',
        name: 'GPT-3.5 Turbo 16K',
        provider: 'openai',
        icon: '🚀',
        supportsVision: false,
        supportsAudio: false,
        enabled: true,
      },
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        provider: 'openai',
        icon: '🤖',
        supportsVision: true,
        supportsAudio: true,
        enabled: true,
      },
      {
        id: 'gpt-4o-mini',
        name: 'GPT-4o mini',
        provider: 'openai',
        icon: '⚡',
        supportsVision: true,
        supportsAudio: true,
        enabled: true,
      },
      {
        id: 'gpt-4.1',
        name: 'GPT-4.1',
        provider: 'openai',
        icon: '🧠',
        supportsVision: false,
        supportsAudio: false,
        enabled: true,
      },
      {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
        provider: 'openai',
        icon: '🧠',
        supportsVision: false,
        supportsAudio: false,
        enabled: true,
      },
      // Placeholders for future providers
      {
        id: 'deepseek-chat',
        name: 'DeepSeek Chat',
        provider: 'deepseek',
        icon: '🔍',
        supportsVision: false,
        supportsAudio: false,
        enabled: false,
      },
      {
        id: 'claude-3-sonnet',
        name: 'Claude 3 Sonnet',
        provider: 'anthropic',
        icon: '🎨',
        supportsVision: false,
        supportsAudio: false,
        enabled: false,
      },
    ];
  }
}
