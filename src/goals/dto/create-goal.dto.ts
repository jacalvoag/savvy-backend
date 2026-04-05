import { IsString, IsNumber, IsPositive, IsDateString, IsOptional } from 'class-validator';

export class CreateGoalDto {
  @IsString()
  nombre: string;

  @IsNumber()
  @IsPositive()
  montoMeta: number;

  @IsDateString()
  fechaInicio: string;

  @IsOptional()
  @IsDateString()
  fechaFin?: string;
}

