import { AiService } from './ai.service';

describe('AiService', () => {
  it('should be defined', () => {
    const mockConfigService = {
      get: jest.fn().mockReturnValue('test-key'),
    };
    const service = new AiService(mockConfigService as any);
    expect(service).toBeDefined();
  });
});