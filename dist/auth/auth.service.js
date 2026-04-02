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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = require("bcrypt");
const prisma_service_1 = require("../prisma/prisma.service");
let AuthService = class AuthService {
    constructor(prisma, jwtService, configService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async register(dto) {
        const exists = await this.prisma.user.findUnique({
            where: { correo: dto.correo },
        });
        if (exists)
            throw new common_1.ConflictException('El correo ya está registrado');
        const hashed = await bcrypt.hash(dto.password, 12);
        const user = await this.prisma.user.create({
            data: { nombre: dto.nombre, correo: dto.correo, password: hashed },
            select: { id: true, nombre: true, correo: true, avatarUrl: true, plan: true, createdAt: true },
        });
        await this.sendBrevoEmail(user.correo, user.nombre, 'welcome');
        const tokens = this.generateTokens(user.id, user.correo);
        return { user: { ...user, id: String(user.id) }, ...tokens };
    }
    async login(dto) {
        const user = await this.prisma.user.findUnique({ where: { correo: dto.correo } });
        if (!user)
            throw new common_1.UnauthorizedException('Credenciales incorrectas');
        const valid = await bcrypt.compare(dto.password, user.password);
        if (!valid)
            throw new common_1.UnauthorizedException('Credenciales incorrectas');
        const { password: _, ...safeUser } = user;
        const tokens = this.generateTokens(user.id, user.correo);
        return { user: { ...safeUser, id: String(safeUser.id) }, ...tokens };
    }
    async refresh(refreshToken) {
        try {
            const payload = this.jwtService.verify(refreshToken, {
                secret: this.configService.get('JWT_SECRET'),
            });
            const user = await this.prisma.user.findUnique({
                where: { id: payload.sub },
                select: { id: true, correo: true },
            });
            if (!user)
                throw new common_1.UnauthorizedException('Token inválido');
            const { accessToken } = this.generateTokens(user.id, user.correo);
            return { accessToken };
        }
        catch {
            throw new common_1.UnauthorizedException('Refresh token inválido o expirado');
        }
    }
    generateTokens(userId, correo) {
        const payload = { sub: userId, correo };
        const secret = this.configService.get('JWT_SECRET');
        const accessToken = this.jwtService.sign(payload, { secret, expiresIn: '15m' });
        const refreshToken = this.jwtService.sign(payload, { secret, expiresIn: '7d' });
        return { accessToken, refreshToken };
    }
    async sendBrevoEmail(email, nombre, type) {
        const apiKey = this.configService.get('BREVO_API_KEY');
        if (!apiKey)
            return;
        const templates = {
            welcome: { subject: '¡Bienvenido a Savvy!', body: `Hola ${nombre}, tu cuenta ha sido creada exitosamente.` },
            goal_created: { subject: 'Nueva meta creada', body: `Hola ${nombre}, tu nueva meta de ahorro ha sido registrada.` },
            goal_completed: { subject: '¡Meta completada!', body: `¡Felicidades ${nombre}! Has alcanzado tu meta de ahorro.` },
        };
        const tpl = templates[type];
        try {
            await fetch('https://api.brevo.com/v3/smtp/email', {
                method: 'POST',
                headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sender: { name: 'Savvy', email: 'no-reply@savvy.app' },
                    to: [{ email, name: nombre }],
                    subject: tpl.subject,
                    textContent: tpl.body,
                }),
            });
        }
        catch {
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map
