import { IsString, IsArray, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class ChatRequestDto {
  @IsArray()
  messages: Array<{ role: string; content: string }>;

  @IsOptional()
  @IsString()
  systemPrompt?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(4000)
  maxTokens?: number;
}
