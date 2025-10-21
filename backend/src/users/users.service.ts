import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findOrCreate(userData: { id: number; username: string; firstName: string }): Promise<User> {
    let user = await this.usersRepository.findOne({ where: { id: userData.id } });
    
    if (!user) {
      user = this.usersRepository.create({
        id: userData.id,
        username: userData.username,
        firstName: userData.firstName,
      });
      await this.usersRepository.save(user);
    }
    
    return user;
  }

  async findOne(id: number): Promise<User> {
    return this.usersRepository.findOne({ where: { id } });
  }
}

