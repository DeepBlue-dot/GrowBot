import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@growbot/database';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Successfully connected to PostgreSQL via Prisma ORM');
    } catch {
      this.logger.warn(
        'PostgreSQL connection offline. Running in fallback simulation mode.',
      );
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
