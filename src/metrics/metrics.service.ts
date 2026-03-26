import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MetricsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async getPortfolio(userId: number) {
    const movements = await this.prisma.movement.findMany({ where: { usuarioId: userId } });

    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    let total = 0;
    let thisMonthBalance = 0;
    let lastMonthBalance = 0;

    for (const m of movements) {
      const amount = Number(m.monto);
      const signed = m.tipo === 'ingreso' ? amount : -amount;
      total += signed;

      const fecha = new Date(m.fecha);
      if (fecha >= startOfThisMonth) {
        thisMonthBalance += signed;
      } else if (fecha >= startOfLastMonth && fecha < startOfThisMonth) {
        lastMonthBalance += signed;
      }
    }

    let variacion = 0;
    if (lastMonthBalance !== 0) {
      variacion = ((thisMonthBalance - lastMonthBalance) / Math.abs(lastMonthBalance)) * 100;
    } else if (thisMonthBalance > 0) {
      variacion = 100;
    }

    const mxnRate = await this.getMxnRate();

    return {
      total: Math.round(total * 100) / 100,
      variacion: Math.round(variacion * 10) / 10,
      rates: { MXN: mxnRate },
    };
  }

  async getPerformance(userId: number, period: string) {
    const now = new Date();
    let startDate: Date;
    let groupBy: 'hour' | 'day' | 'week' | 'month';

    switch (period) {
      case '1D':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        groupBy = 'hour';
        break;
      case '1W':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        groupBy = 'day';
        break;
      case '1Y':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        groupBy = 'month';
        break;
      case '1M':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        groupBy = 'day';
        break;
    }

    const movements = await this.prisma.movement.findMany({
      where: { usuarioId: userId, fecha: { gte: startDate } },
      orderBy: { fecha: 'asc' },
