import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { BotService, Update } from './bot.service';

@Controller('telegram')
export class BotController {
  private readonly logger = new Logger(BotController.name);

  constructor(private readonly botService: BotService) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Body() update: Record<string, unknown>,
    @Headers('x-telegram-bot-api-secret-token') secretHeader: string,
  ) {
    if (!this.botService.verifySecretHeader(secretHeader)) {
      this.logger.warn('Invalid Telegram secret header token received');
      return { ok: false, error: 'Unauthorized secret token' };
    }

    try {
      return await this.botService.processUpdate(update as unknown as Update);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Exception processing Telegram webhook: ${msg}`);
      return { ok: true, processed: false, error: msg };
    }
  }
}
