import { IsNotEmpty, IsString } from 'class-validator';

export class TelegramMiniAppLoginDto {
  @IsString()
  @IsNotEmpty({ message: 'initDataRaw is required for Mini App authentication' })
  initDataRaw!: string;
}
