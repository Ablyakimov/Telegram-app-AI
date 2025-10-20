import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import crypto from 'crypto';

@Injectable()
export class TelegramAuthService {
  constructor(private config: ConfigService) {}

  // Validates initData per Telegram docs: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
  validateInitData(initData: string): { user?: any } {
    console.log('Received initData:', initData);
    
    if (!initData) throw new UnauthorizedException('No initData');

    // Development fallback
    if (initData === 'dev-fallback') {
      console.log('Using dev fallback');
      return { user: { id: 1, first_name: 'Dev User', username: 'devuser' } };
    }

    const urlSearchParams = new URLSearchParams(initData);
    const hash = urlSearchParams.get('hash');
    if (!hash) throw new UnauthorizedException('No hash provided');

    const dataCheckArr: string[] = [];
    urlSearchParams.forEach((value, key) => {
      if (key !== 'hash') {
        dataCheckArr.push(`${key}=${value}`);
      }
    });
    dataCheckArr.sort();
    const dataCheckString = dataCheckArr.join('\n');

    const botToken = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    if (!botToken) throw new UnauthorizedException('Bot token not configured');

    const secret = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    const signature = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex');

    if (signature !== hash) throw new UnauthorizedException('Invalid hash');

    // Extract user
    const userRaw = urlSearchParams.get('user');
    let user: any | undefined;
    if (userRaw) {
      try {
        user = JSON.parse(userRaw);
      } catch {}
    }
    return { user };
  }
}


