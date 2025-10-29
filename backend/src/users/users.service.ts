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

  async findOrCreate(userData: { id: number; username: string | null; firstName: string }): Promise<User> {
    // 1) Try by Telegram ID (preferred key)
    let user = await this.usersRepository.findOne({ where: { id: userData.id } });
    if (user) {
      // Optionally sync username/firstName if changed
      const needsUpdate = (user.username ?? null) !== (userData.username ?? null) || user.firstName !== (userData.firstName || '');
      if (needsUpdate) {
        user.username = userData.username ?? null;
        user.firstName = userData.firstName || '';
        await this.usersRepository.save(user);
      }
      return user;
    }

    // 2) If not found by id, try by username (may exist from earlier schema)
    if (userData.username) {
      const byUsername = await this.usersRepository.findOne({ where: { username: userData.username } });
      if (byUsername) {
        // Reuse existing account (do not change PK). Optionally update firstName.
        if (byUsername.firstName !== (userData.firstName || '')) {
          byUsername.firstName = userData.firstName || '';
          await this.usersRepository.save(byUsername);
        }
        return byUsername;
      }
    }
    
    if (!user) {
      user = this.usersRepository.create({
        id: userData.id,
        username: userData.username ?? null,
        firstName: userData.firstName || '',
      });
      await this.usersRepository.save(user);
    }
    
    return user;
  }

  async findOne(id: number): Promise<User> {
    return this.usersRepository.findOne({ where: { id } });
  }
}

