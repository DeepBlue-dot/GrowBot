import {
  Controller,
  Post,
  Body,
  Headers,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BotService, Update } from './bot.service';

@Controller('telegram')
export class BotController {
  constructor(private readonly botService: BotService) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Body() update: Record<string, unknown>,
    @Headers('x-telegram-bot-api-secret-token') secretHeader: string,
  ) {
    if (!this.botService.verifySecretHeader(secretHeader)) {
      throw new UnauthorizedException('Invalid Telegram secret header token');
    }
    return this.botService.processUpdate(update as unknown as Update);
  }
}
