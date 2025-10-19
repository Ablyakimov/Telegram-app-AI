import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { TelegramAuthService } from './telegram-auth.service';

@Injectable()
export class TelegramGuard implements CanActivate {
  constructor(private readonly tgAuth: TelegramAuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    const initData = (request.headers['x-telegram-initdata'] as string) || (request.query.initData as string);
    const devBypass = process.env.TELEGRAM_DEV_BYPASS === 'true' || process.env.NODE_ENV === 'development';
    if (!initData) {
      if (devBypass) {
        request.telegramUser = { id: 1, username: 'dev', first_name: 'Dev' };
        return true;
      }
      throw new UnauthorizedException('Missing Telegram initData');
    }

    const { user } = this.tgAuth.validateInitData(initData);
    request.telegramUser = user;
    return true;
  }
}


