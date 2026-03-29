import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { BoostGoalDto } from './dto/boost-goal.dto';

function serializeGoal(g: any) {
  const montoMeta = Number(g.montoMeta);
  const montoActual = Number(g.montoActual);
  const porcentaje = montoMeta > 0 ? Math.min((montoActual / montoMeta) * 100, 100) : 0;
  return { ...g, id: String(g.id), usuarioId: String(g.usuarioId), montoMeta, montoActual, porcentaje: Math.round(porcentaje * 100) / 100 };
}

@Injectable()
export class GoalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async getAll(userId: number) {
    const goals = await this.prisma.goal.findMany({
      where: { usuarioId: userId },
      orderBy: { fechaInicio: 'desc' },
    });
    return goals.map(serializeGoal);
  }

  async create(userId: number, dto: CreateGoalDto) {
    const goal = await this.prisma.goal.create({
      data: {
        usuarioId: userId,
        nombre: dto.nombre,
        montoMeta: dto.montoMeta,
        fechaInicio: new Date(dto.fechaInicio),
        fechaFin: dto.fechaFin ? new Date(dto.fechaFin) : undefined,
      },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { correo: true, nombre: true },
    });
    if (user) await this.sendBrevoEmail(user.correo, user.nombre, 'goal_created');

    return serializeGoal(goal);
  }

  async update(userId: number, goalId: number, dto: Partial<CreateGoalDto>) {
    const goal = await this.prisma.goal.findUnique({ where: { id: goalId } });

    if (!goal) throw new NotFoundException('Meta no encontrada');
    if (goal.usuarioId !== userId) throw new ForbiddenException('Sin permisos');

    const updated = await this.prisma.goal.update({
      where: { id: goalId },
      data: {
        ...(dto.nombre && { nombre: dto.nombre }),
        ...(dto.montoMeta && { montoMeta: dto.montoMeta }),
        ...(dto.fechaFin && { fechaFin: new Date(dto.fechaFin) }),
      },
    });

    return serializeGoal(updated);
  }

  async delete(userId: number, goalId: number) {
    const goal = await this.prisma.goal.findUnique({ where: { id: goalId } });

    if (!goal) throw new NotFoundException('Meta no encontrada');
    if (goal.usuarioId !== userId) throw new ForbiddenException('Sin permisos');

    await this.prisma.goal.delete({ where: { id: goalId } });
    return { message: 'Meta eliminada' };
  }

  async boost(userId: number, goalId: number, dto: BoostGoalDto) {
    const goal = await this.prisma.goal.findUnique({ where: { id: goalId } });

    if (!goal) throw new NotFoundException('Meta no encontrada');
    if (goal.usuarioId !== userId) throw new ForbiddenException('Sin permisos');

    const newAmount = Number(goal.montoActual) + dto.monto;
    const completed = newAmount >= Number(goal.montoMeta);

    const updated = await this.prisma.goal.update({
      where: { id: goalId },
      data: { montoActual: newAmount, completada: completed },
    });

    if (completed) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { correo: true, nombre: true },
      });
      if (user) await this.sendBrevoEmail(user.correo, user.nombre, 'goal_completed');

      await this.prisma.notification.create({
        data: {
