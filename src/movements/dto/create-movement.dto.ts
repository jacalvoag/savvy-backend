import { IsString, IsNumber, IsPositive, IsOptional, IsDateString, IsIn } from 'class-validator';

export class CreateMovementDto {
  @IsNumber()
  @IsPositive()
  monto: number;

  @IsString()
  @IsIn(['ingreso', 'egreso'])
  tipo: string;

  @IsString()
  @IsIn(['salary', 'groceries', 'transport', 'entertainment', 'savings', 'dividends', 'subscription', 'food', 'other'])
  categoria: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsDateString()
  fecha: string;

  @IsOptional()
  @IsString()
  moneda?: string;
}
