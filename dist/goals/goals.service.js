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
exports.GoalsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
function serializeGoal(g) {
    const montoMeta = Number(g.montoMeta);
    const montoActual = Number(g.montoActual);
    const porcentaje = montoMeta > 0 ? Math.min((montoActual / montoMeta) * 100, 100) : 0;
    return { ...g, id: String(g.id), usuarioId: String(g.usuarioId), montoMeta, montoActual, porcentaje: Math.round(porcentaje * 100) / 100 };
}
let GoalsService = class GoalsService {
    constructor(prisma, configService) {
        this.prisma = prisma;
        this.configService = configService;
    }
    async getAll(userId) {
        const goals = await this.prisma.goal.findMany({
            where: { usuarioId: userId },
            orderBy: { fechaInicio: 'desc' },
        });
        return goals.map(serializeGoal);
    }
    async create(userId, dto) {
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
        if (user)
            await this.sendBrevoEmail(user.correo, user.nombre, 'goal_created');
        return serializeGoal(goal);
    }
    async update(userId, goalId, dto) {
        const goal = await this.prisma.goal.findUnique({ where: { id: goalId } });
        if (!goal)
            throw new common_1.NotFoundException('Meta no encontrada');
        if (goal.usuarioId !== userId)
            throw new common_1.ForbiddenException('Sin permisos');
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
    async delete(userId, goalId) {
        const goal = await this.prisma.goal.findUnique({ where: { id: goalId } });
        if (!goal)
            throw new common_1.NotFoundException('Meta no encontrada');
        if (goal.usuarioId !== userId)
            throw new common_1.ForbiddenException('Sin permisos');
        await this.prisma.goal.delete({ where: { id: goalId } });
        return { message: 'Meta eliminada' };
    }
    async boost(userId, goalId, dto) {
        const goal = await this.prisma.goal.findUnique({ where: { id: goalId } });
        if (!goal)
