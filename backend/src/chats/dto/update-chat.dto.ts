import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class UpdateChatDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;
}

