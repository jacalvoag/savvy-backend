import {
  Controller, Get, Post, Patch, Delete, Body, Param,
  ParseIntPipe, UseGuards, Request, HttpCode, HttpStatus,
} from '@nestjs/common';
import { GoalsService } from './goals.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { BoostGoalDto } from './dto/boost-goal.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('goals')
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Get()
  getAll(@Request() req) {
    return this.goalsService.getAll(req.user.id);
  }

  @Post()
  create(@Request() req, @Body() dto: CreateGoalDto) {
    return this.goalsService.create(req.user.id, dto);
  }

  @Patch(':id/boost')
  boost(@Request() req, @Param('id', ParseIntPipe) id: number, @Body() dto: BoostGoalDto) {
    return this.goalsService.boost(req.user.id, id, dto);
  }

  @Patch(':id/archive')
  archive(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.goalsService.archive(req.user.id, id);
