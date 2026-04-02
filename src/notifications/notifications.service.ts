import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll(userId: number) {
    const notifs = await this.prisma.notification.findMany({
      where: { usuarioId: userId },
      orderBy: { createdAt: 'desc' },
    });
    return notifs.map((n) => ({ ...n, id: String(n.id), usuarioId: String(n.usuarioId) }));
  }

  async markRead(userId: number, notifId: number) {
    const notif = await this.prisma.notification.findUnique({ where: { id: notifId } });
    if (!notif) throw new NotFoundException('Notificación no encontrada');
    if (notif.usuarioId !== userId) throw new ForbiddenException('Sin permisos');
    const updated = await this.prisma.notification.update({
      where: { id: notifId },
      data: { leida: true },
    });
    return { ...updated, id: String(updated.id), usuarioId: String(updated.usuarioId) };
  }
}

