import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from "typeorm";
import { Chat } from "../../chats/entities/chat.entity";

export enum UserRole {
  USER = "user",
  ADMIN = "admin",
}

@Entity("users")
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: true, default: null })
  username: string | null;

  @Column({ default: "" })
  firstName: string;

  @Column({
    type: "varchar",
    default: UserRole.USER,
  })
  role: UserRole;

  @OneToMany(() => Chat, (chat) => chat.user)
  chats: Chat[];
}
