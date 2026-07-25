import { IsString, IsOptional, IsEnum, IsInt, IsArray } from 'class-validator';

export class CampaignRuleInput {
  @IsOptional()
  @IsString()
  id?: string;

  @IsEnum(['IMMEDIATE', 'TIME_BOUND', 'MESSAGE_COUNT'])
  type!: 'IMMEDIATE' | 'TIME_BOUND' | 'MESSAGE_COUNT';

  @IsOptional()
  @IsInt()
  minStayHours?: number;

  @IsOptional()
  @IsInt()
  minMessages?: number;
}

export class CreateCampaignDto {
  @IsString()
  communityId!: string;

  @IsOptional()
  @IsString()
  createdById?: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['MILESTONE', 'LEADERBOARD'])
  type?: 'MILESTONE' | 'LEADERBOARD';

  @IsOptional()
  @IsInt()
  targetReferrals?: number;

  @IsOptional()
  @IsString()
  rewardTitle?: string;

  @IsOptional()
  @IsString()
  rewardDescription?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsArray()
  rules?: CampaignRuleInput[];
}

export class UpdateCampaignDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['MILESTONE', 'LEADERBOARD'])
  type?: 'MILESTONE' | 'LEADERBOARD';

  @IsOptional()
  @IsInt()
  targetReferrals?: number;

  @IsOptional()
  @IsString()
  rewardDescription?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsEnum(['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'])
  status?: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';

  @IsOptional()
  @IsArray()
  rules?: CampaignRuleInput[];
}
