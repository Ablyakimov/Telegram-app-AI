import { IsString, IsNumber } from 'class-validator';

export class CreateChatDto {
  @IsString()
  name: string;

  @IsNumber()
  userId: number;
}

