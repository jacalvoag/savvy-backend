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
exports.MovementsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
function serializeMovement(m) {
    return { ...m, id: String(m.id), usuarioId: String(m.usuarioId), monto: Number(m.monto) };
}
let MovementsService = class MovementsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getAll(userId) {
        const movements = await this.prisma.movement.findMany({
            where: { usuarioId: userId },
            orderBy: { fecha: 'desc' },
        });
        return movements.map(serializeMovement);
    }
    async create(userId, dto) {
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
    async remove(userId, id) {
        const movement = await this.prisma.movement.findUnique({ where: { id } });
        if (!movement)
            throw new common_1.NotFoundException('Movimiento no encontrado');
        if (movement.usuarioId !== userId)
            throw new common_1.ForbiddenException('Sin permisos para eliminar este movimiento');
        await this.prisma.movement.delete({ where: { id } });
        return { message: 'Movimiento eliminado' };
    }
    async update(userId, id, dto) {
        const movement = await this.prisma.movement.findUnique({ where: { id } });
        if (!movement)
            throw new common_1.NotFoundException('Movimiento no encontrado');
        if (movement.usuarioId !== userId)
            throw new common_1.ForbiddenException('Sin permisos');
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
};
exports.MovementsService = MovementsService;
exports.MovementsService = MovementsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MovementsService);
//# sourceMappingURL=movements.service.js.map
