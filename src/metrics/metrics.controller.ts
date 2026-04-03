import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get('portfolio')
  getPortfolio(@Request() req) {
    return this.metricsService.getPortfolio(req.user.id);
  }

  @Get('performance')
  getPerformance(@Request() req, @Query('period') period: string = '1M') {
    return this.metricsService.getPerformance(req.user.id, period);
  }

  @Get('insight')
  getInsight(@Request() req) {
    return this.metricsService.getInsight(req.user.id);
  }
}

