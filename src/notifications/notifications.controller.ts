import { Controller, Get, Patch, Param, ParseIntPipe, UseGuards, Request } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  getAll(@Request() req) {
    return this.notificationsService.getAll(req.user.id);
  }

  @Patch(':id/read')
  markRead(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.notificationsService.markRead(req.user.id, id);
  }
}

