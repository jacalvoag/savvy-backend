import { IsNumber, IsPositive } from 'class-validator';

export class BoostGoalDto {
  @IsNumber()
  @IsPositive()
  monto: number;
}

