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
exports.MetricsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
let MetricsService = class MetricsService {
    constructor(prisma, configService) {
        this.prisma = prisma;
        this.configService = configService;
    }
    async getPortfolio(userId) {
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
            }
            else if (fecha >= startOfLastMonth && fecha < startOfThisMonth) {
                lastMonthBalance += signed;
            }
        }
        let variacion = 0;
        if (lastMonthBalance !== 0) {
            variacion = ((thisMonthBalance - lastMonthBalance) / Math.abs(lastMonthBalance)) * 100;
        }
        else if (thisMonthBalance > 0) {
            variacion = 100;
        }
        const mxnRate = await this.getMxnRate();
        return {
            total: Math.round(total * 100) / 100,
            variacion: Math.round(variacion * 10) / 10,
            rates: { MXN: mxnRate },
        };
    }
    async getPerformance(userId, period) {
        const now = new Date();
        let startDate;
        let groupBy;
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
