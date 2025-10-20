import { ChatsService } from './chats.service';

describe('ChatsService', () => {
  it('should be defined', () => {
    const mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
    };
    const service = new ChatsService(mockRepository as any);
    expect(service).toBeDefined();
  });
});
