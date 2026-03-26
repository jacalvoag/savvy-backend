import {
  Injectable, NotFoundException, ForbiddenException, ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { JoinGroupDto } from './dto/join-group.dto';
import { ContributeDto } from './dto/contribute.dto';
// nanoid v3 uses CommonJS require
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { nanoid } = require('nanoid');

function serializeGroup(g: any) {
  return { ...g, id: String(g.id), liderId: String(g.liderId), metaAhorro: Number(g.metaAhorro) };
}

@Injectable()
export class GroupsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll(userId: number) {
    const memberships = await this.prisma.groupMember.findMany({
      where: { usuarioId: userId },
      include: { grupo: true },
    });
    return memberships.map((m) => serializeGroup(m.grupo));
  }

  async create(userId: number, dto: CreateGroupDto) {
    const inviteCode = nanoid(9).toUpperCase();

    const group = await this.prisma.group.create({
      data: {
        nombre: dto.nombre,
        metaAhorro: Number(dto.metaAhorro),
        inviteCode,
        liderId: userId,
        members: { create: { usuarioId: userId } },
      },
    });

    return serializeGroup(group);
  }

  async getDetail(groupId: number, currentUserId: number) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: { usuario: { select: { id: true, nombre: true, avatarUrl: true } } },
        },
      },
    });

    if (!group) throw new NotFoundException('Grupo no encontrado');

    const isMember = group.members.some((m) => m.usuarioId === currentUserId);
    if (!isMember) throw new ForbiddenException('No eres miembro de este grupo');

    const totalAcumulado = group.members.reduce((sum, m) => sum + Number(m.contribucion), 0);
    const metaAhorro = Number(group.metaAhorro);
    const porcentajeGrupal = metaAhorro > 0 ? Math.min((totalAcumulado / metaAhorro) * 100, 100) : 0;

    const sorted = [...group.members].sort((a, b) => Number(b.contribucion) - Number(a.contribucion));

    const miembros = sorted.map((m, idx) => ({
      rank: idx + 1,
      usuarioId: String(m.usuarioId),
      nombre: m.usuario.nombre,
      avatarUrl: m.usuario.avatarUrl ?? undefined,
      contribucion: Number(m.contribucion),
      porcentaje: totalAcumulado > 0 ? Math.round((Number(m.contribucion) / totalAcumulado) * 10000) / 100 : 0,
      streakWeeks: m.streakWeeks,
      isCurrentUser: m.usuarioId === currentUserId,
    }));

    return {
      id: String(group.id),
      nombre: group.nombre,
      metaAhorro,
