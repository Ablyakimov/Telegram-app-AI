import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from "typeorm";
import { Chat } from "../../chats/entities/chat.entity";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: true, default: null })
  username: string | null;

  @Column({ default: "" })
  firstName: string;

  @OneToMany(() => Chat, (chat) => chat.user)
  chats: Chat[];
}
