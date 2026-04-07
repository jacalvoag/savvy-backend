import {
  Controller, Get, Post, Patch, Delete, Body, Param,
  ParseIntPipe, UseGuards, Request, HttpCode, HttpStatus,
} from '@nestjs/common';
import { MovementsService } from './movements.service';
import { CreateMovementDto } from './dto/create-movement.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('movements')
export class MovementsController {
  constructor(private readonly movementsService: MovementsService) {}

  @Get()
  getAll(@Request() req) {
    return this.movementsService.getAll(req.user.id);
  }

  @Post()
  create(@Request() req, @Body() dto: CreateMovementDto) {
    return this.movementsService.create(req.user.id, dto);
  }

  @Patch(':id')
  update(@Request() req, @Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreateMovementDto>) {
    return this.movementsService.update(req.user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.movementsService.remove(req.user.id, id);
  }
}

