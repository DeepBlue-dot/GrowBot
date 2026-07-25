import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export interface EmitEventPayload {
  campaignId: string;
  participantId?: string;
  userId?: string;
  referralId?: string;
  eventType: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class EventService {
  private readonly logger = new Logger(EventService.name);

  constructor(private readonly prisma: PrismaService) {}

  async emitEvent(payload: EmitEventPayload) {
    try {
      const event = await this.prisma.campaignEvent.create({
        data: {
          campaignId: payload.campaignId,
          participantId: payload.participantId || null,
          userId: payload.userId || null,
          referralId: payload.referralId || null,
          eventType: payload.eventType,
          metadata: payload.metadata || {},
        },
      });
      this.logger.log(
        `📌 [CampaignEvent] ${payload.eventType} for campaign ${payload.campaignId} (id: ${event.id})`,
      );
      return event;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `Failed to emit CampaignEvent ${payload.eventType}: ${msg}`,
      );
      return null;
    }
  }
}
