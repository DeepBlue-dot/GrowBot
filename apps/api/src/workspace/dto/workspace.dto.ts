import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class CreateWorkspaceDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  slug!: string;

  @IsOptional()
  @IsIn(['FREE', 'PRO', 'ENTERPRISE'])
  plan?: 'FREE' | 'PRO' | 'ENTERPRISE';
}

export class UpdateWorkspaceDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsIn(['FREE', 'PRO', 'ENTERPRISE'])
  plan?: 'FREE' | 'PRO' | 'ENTERPRISE';
}
