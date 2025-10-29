import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  Max,
} from "class-validator";

export class SendMessageDto {
  @IsNumber()
  chatId: number;

  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  systemPrompt?: string;

  @IsOptional()
  @Min(0)
  @Max(2)
  temperature?: number;

  @IsOptional()
  @Min(1)
  maxTokens?: number;
}
