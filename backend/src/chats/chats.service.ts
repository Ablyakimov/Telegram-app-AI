import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Chat } from "./entities/chat.entity";
import { CreateChatDto } from "./dto/create-chat.dto";

@Injectable()
export class ChatsService {
  constructor(
    @InjectRepository(Chat)
    private chatsRepository: Repository<Chat>,
  ) {}

  async create(createChatDto: CreateChatDto): Promise<Chat> {
    const chat = this.chatsRepository.create({
      name: createChatDto.name,
      userId: createChatDto.userId,
      messages: [],
      aiModel: createChatDto.aiModel || "gpt-3.5-turbo",
    });
    return this.chatsRepository.save(chat);
  }

  async findByUserId(userId: number): Promise<Chat[]> {
    return this.chatsRepository.find({
      where: { userId },
      order: { createdAt: "DESC" },
    });
  }

  async findOne(id: number): Promise<Chat> {
    const chat = await this.chatsRepository.findOne({ where: { id } });
    if (!chat) {
      throw new NotFoundException(`Chat with ID ${id} not found`);
    }
    return chat;
  }

  async addMessage(
    chatId: number,
    role: string,
    content: string,
  ): Promise<Chat> {
    const chat = await this.findOne(chatId);
    const message = {
      role,
      content,
      timestamp: new Date().toISOString(),
    };
    chat.messages.push(message);
    return this.chatsRepository.save(chat);
  }

  async getMessages(chatId: number) {
    const chat = await this.findOne(chatId);
    return chat.messages;
  }

  async updateName(
    chatId: number,
    newName: string,
    userId: number,
  ): Promise<Chat> {
    const chat = await this.findOne(chatId);

    // Verify ownership
    if (chat.userId !== userId) {
      throw new NotFoundException("Chat not found or access denied");
    }

    chat.name = newName;
    return this.chatsRepository.save(chat);
  }

  async remove(chatId: number, userId: number): Promise<void> {
    const chat = await this.findOne(chatId);
    if (chat.userId !== userId) {
      throw new NotFoundException("Chat not found or access denied");
    }

    await this.chatsRepository.remove(chat);
  }
}
