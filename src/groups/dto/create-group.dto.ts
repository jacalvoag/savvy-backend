import { IsString, MinLength, IsNumber, IsPositive } from 'class-validator';

export class CreateGroupDto {
  @IsString()
  @MinLength(1)
  nombre: string;

  @IsNumber()
  @IsPositive()
  metaAhorro: number;
}
