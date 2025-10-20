import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AiService } from './ai.service';

describe('AiService', () => {
  let service: AiService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                OPENAI_API_KEY: 'test-key',
                OPENAI_MODEL: 'gpt-4',
                OPENAI_TEMPERATURE: 0.7,
                OPENAI_MAX_TOKENS: 1000,
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have correct default values', () => {
    expect(configService.get).toHaveBeenCalledWith('OPENAI_API_KEY');
    expect(configService.get).toHaveBeenCalledWith('OPENAI_MODEL', 'gpt-4');
  });
});
