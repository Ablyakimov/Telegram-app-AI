import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateChatDto {
  @IsString()
  name: string;

  @IsNumber()
  userId: number;

  // Optional AI model id (defaults to gpt-4o)
  @IsOptional()
  @IsString()
  aiModel?: string;
}

