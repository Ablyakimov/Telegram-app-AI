import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatsService } from './chats.service';
import { Chat } from './entities/chat.entity';
import { UsersService } from '../users/users.service';

describe('ChatsService', () => {
  let service: ChatsService;
  let repository: Repository<Chat>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const mockUsersService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatsService,
        {
          provide: getRepositoryToken(Chat),
          useValue: mockRepository,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    service = module.get<ChatsService>(ChatsService);
    repository = module.get<Repository<Chat>>(getRepositoryToken(Chat));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new chat', async () => {
      const createChatDto = { name: 'Test Chat', userId: 1 };
      const expectedChat = { id: 1, ...createChatDto, messages: [] };

      mockRepository.create.mockReturnValue(expectedChat);
      mockRepository.save.mockResolvedValue(expectedChat);

      const result = await service.create(createChatDto);

      expect(mockRepository.create).toHaveBeenCalledWith(createChatDto);
      expect(mockRepository.save).toHaveBeenCalledWith(expectedChat);
      expect(result).toEqual(expectedChat);
    });
  });

  describe('findByUserId', () => {
    it('should return chats for a user', async () => {
      const userId = 1;
      const expectedChats = [
        { id: 1, name: 'Chat 1', userId, messages: [] },
        { id: 2, name: 'Chat 2', userId, messages: [] },
      ];

      mockRepository.find.mockResolvedValue(expectedChats);

      const result = await service.findByUserId(userId);

      expect(mockRepository.find).toHaveBeenCalledWith({ where: { userId } });
      expect(result).toEqual(expectedChats);
    });
  });
});
