"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const { nanoid } = require('nanoid');
function serializeGroup(g) {
    return { ...g, id: String(g.id), liderId: String(g.liderId), metaAhorro: Number(g.metaAhorro) };
}
let GroupsService = class GroupsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getAll(userId) {
        const memberships = await this.prisma.groupMember.findMany({
            where: { usuarioId: userId },
            include: { grupo: true },
        });
        return memberships.map((m) => serializeGroup(m.grupo));
    }
    async create(userId, dto) {
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
    async getDetail(groupId, currentUserId) {
        const group = await this.prisma.group.findUnique({
            where: { id: groupId },
            include: {
                members: {
                    include: { usuario: { select: { id: true, nombre: true, avatarUrl: true } } },
                },
            },
        });
        if (!group)
            throw new common_1.NotFoundException('Grupo no encontrado');
        const isMember = group.members.some((m) => m.usuarioId === currentUserId);
        if (!isMember)
            throw new common_1.ForbiddenException('No eres miembro de este grupo');
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
            inviteCode: group.inviteCode,
            liderId: String(group.liderId),
            createdAt: group.createdAt,
            totalAcumulado,
