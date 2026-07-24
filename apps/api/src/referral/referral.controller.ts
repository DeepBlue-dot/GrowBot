import { Controller, Post, Body } from '@nestjs/common';
import { ReferralService } from './referral.service';

@Controller('referral')
export class ReferralController {
  constructor(private readonly referralService: ReferralService) {}

  @Post('intent')
  async registerIntent(@Body() body: { referrerCode: string; inviteeId: string; communityChatId: string }) {
    return this.referralService.registerIntent(
      body.referrerCode || 'alex_web3',
      body.inviteeId || '987654321',
      body.communityChatId || '-100123456789',
    );
  }
}
