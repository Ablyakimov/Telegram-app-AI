import { Controller, Get, UseGuards, Req } from "@nestjs/common";
import { UsersService } from "./users.service";
import { TelegramGuard } from "../telegram-auth/telegram.guard";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("me")
  @UseGuards(TelegramGuard)
  async getCurrentUser(@Req() req: any) {
    const telegramUser = req.telegramUser;
    if (!telegramUser || !telegramUser.id) {
      return null;
    }

    const user = await this.usersService.findOne(telegramUser.id);
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      role: user.role,
    };
  }
}
