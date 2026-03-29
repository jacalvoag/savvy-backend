import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMovementDto } from './dto/create-movement.dto';

function serializeMovement(m: any) {
  return { ...m, id: String(m.id), usuarioId: String(m.usuarioId), monto: Number(m.monto) };
}

@Injectable()
export class MovementsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll(userId: number) {
    const movements = await this.prisma.movement.findMany({
      where: { usuarioId: userId },
      orderBy: { fecha: 'desc' },
    });
    return movements.map(serializeMovement);
  }

  async create(userId: number, dto: CreateMovementDto) {
    const movement = await this.prisma.movement.create({
      data: {
        usuarioId: userId,
        tipo: dto.tipo,
        monto: dto.monto,
        categoria: dto.categoria,
        descripcion: dto.descripcion,
        moneda: dto.moneda ?? 'USD',
        fecha: new Date(dto.fecha),
      },
    });
    return serializeMovement(movement);
  }

  async remove(userId: number, id: number) {
    const movement = await this.prisma.movement.findUnique({ where: { id } });

    if (!movement) throw new NotFoundException('Movimiento no encontrado');
    if (movement.usuarioId !== userId) throw new ForbiddenException('Sin permisos para eliminar este movimiento');

    await this.prisma.movement.delete({ where: { id } });
    return { message: 'Movimiento eliminado' };
  }

  async update(userId: number, id: number, dto: Partial<CreateMovementDto>) {
    const movement = await this.prisma.movement.findUnique({ where: { id } });

    if (!movement) throw new NotFoundException('Movimiento no encontrado');
    if (movement.usuarioId !== userId) throw new ForbiddenException('Sin permisos');

    const updated = await this.prisma.movement.update({
      where: { id },
      data: {
        ...(dto.monto && { monto: dto.monto }),
        ...(dto.tipo && { tipo: dto.tipo }),
        ...(dto.categoria && { categoria: dto.categoria }),
        ...(dto.descripcion !== undefined && { descripcion: dto.descripcion }),
        ...(dto.fecha && { fecha: new Date(dto.fecha) }),
      },
    });

    return serializeMovement(updated);
  }
}

