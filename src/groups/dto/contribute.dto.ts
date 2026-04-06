import { IsNumber, IsPositive } from 'class-validator';

export class ContributeDto {
  @IsNumber()
  @IsPositive()
  monto: number;
}

