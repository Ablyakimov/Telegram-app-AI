import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('chats')
export class Chat {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  userId: number;

  @ManyToOne(() => User, (user) => user.chats)
  user: User;

  @Column('simple-json', { default: '[]' })
  messages: Array<{
    role: string;
    content: string;
    timestamp: string;
  }>;

  // AI model used in this chat (e.g., gpt-4o, gpt-4o-mini, gpt-3.5-turbo)
  @Column({ default: 'gpt-4o' })
  aiModel: string;

  @CreateDateColumn()
  createdAt: Date;
}

