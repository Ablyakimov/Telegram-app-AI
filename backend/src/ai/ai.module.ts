import { Module } from "@nestjs/common";
import { AiService } from "./ai.service";
import { ModelsController } from "./models.controller";

@Module({
  controllers: [ModelsController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
