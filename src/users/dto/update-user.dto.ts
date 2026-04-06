import { IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  plan?: string;
}

