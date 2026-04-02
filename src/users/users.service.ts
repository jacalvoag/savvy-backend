import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, nombre: true, correo: true, avatarUrl: true, plan: true, createdAt: true },
    });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return { ...user, id: String(user.id) };
  }

  async updateMe(userId: number, dto: UpdateUserDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: { id: true, nombre: true, correo: true, avatarUrl: true, plan: true, createdAt: true },
    });

    return { ...user, id: String(user.id) };
  }
}

