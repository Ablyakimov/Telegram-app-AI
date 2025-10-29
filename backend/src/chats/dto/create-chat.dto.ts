import { IsString, IsNumber, IsOptional, MaxLength } from "class-validator";

export class CreateChatDto {
  @IsString()
  name: string;

  @IsNumber()
  userId: number;

  // Optional AI model id (defaults to gpt-4o)
  @IsOptional()
  @IsString()
  aiModel?: string;

  // Optional system prompt to seed assistant on chat creation
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  systemPrompt?: string;
}
