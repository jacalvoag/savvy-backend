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
    });

    const buckets = new Map<string, number>();

    for (const m of movements) {
      const fecha = new Date(m.fecha);
      let label: string;

      if (groupBy === 'hour') {
        label = `${String(fecha.getHours()).padStart(2, '0')}:00`;
      } else if (groupBy === 'day') {
        label = fecha.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' });
      } else if ((groupBy as string) === 'week') {
        const weekNum = Math.ceil(fecha.getDate() / 7);
        label = `S${weekNum} ${fecha.toLocaleDateString('es-MX', { month: 'short' })}`;
      } else {
        label = fecha.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' });
      }

      const signed = m.tipo === 'ingreso' ? Number(m.monto) : -Number(m.monto);
      buckets.set(label, (buckets.get(label) ?? 0) + signed);
    }

    const points: { label: string; value: number }[] = [];
    let running = 0;
    for (const [label, delta] of buckets.entries()) {
      running += delta;
      points.push({ label, value: Math.round(running * 100) / 100 });
    }

    return points;
  }

  async getInsight(userId: number) {
    const goals = await this.prisma.goal.findMany({
      where: { usuarioId: userId, completada: false, archivada: false },
      orderBy: { montoActual: 'desc' },
    });

    if (goals.length === 0) {
      return {
        mensaje: 'Crea tu primera meta de ahorro para recibir recomendaciones personalizadas.',
        mesesRestantes: 0,
        metaNombre: '',
      };
    }

    const closest = goals.reduce((best, g) => {
      const bestPct = Number(best.montoActual) / Number(best.montoMeta);
      const gPct = Number(g.montoActual) / Number(g.montoMeta);
      return gPct > bestPct ? g : best;
    });

    const remaining = Number(closest.montoMeta) - Number(closest.montoActual);

    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const recentMovements = await this.prisma.movement.findMany({
      where: { usuarioId: userId, fecha: { gte: threeMonthsAgo } },
    });

    let netSavings = 0;
    for (const m of recentMovements) {
      netSavings += m.tipo === 'ingreso' ? Number(m.monto) : -Number(m.monto);
    }

    const monthlyRate = netSavings / 3;
    const mesesRestantes = monthlyRate > 0 ? Math.ceil(remaining / monthlyRate) : 99;
    const porcentaje = Math.round((Number(closest.montoActual) / Number(closest.montoMeta)) * 100);

    return {
      mensaje: `Tu meta "${closest.nombre}" está al ${porcentaje}%. ¡Sigue así para alcanzarla!`,
      mesesRestantes: Math.min(mesesRestantes, 99),
      metaNombre: closest.nombre,
    };
  }

  private async getMxnRate(): Promise<number> {
    const apiKey = this.configService.get<string>('EXCHANGERATE_API_KEY');
