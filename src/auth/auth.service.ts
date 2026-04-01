import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({
      where: { correo: dto.correo },
    });

    if (exists) throw new ConflictException('El correo ya está registrado');

    const hashed = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: { nombre: dto.nombre, correo: dto.correo, password: hashed },
      select: { id: true, nombre: true, correo: true, avatarUrl: true, plan: true, createdAt: true },
    });

    await this.sendBrevoEmail(user.correo, user.nombre, 'welcome');
    const tokens = this.generateTokens(user.id, user.correo);

    return { user: { ...user, id: String(user.id) }, ...tokens };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { correo: dto.correo } });

    if (!user) throw new UnauthorizedException('Credenciales incorrectas');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Credenciales incorrectas');

    const { password: _, ...safeUser } = user;
    const tokens = this.generateTokens(user.id, user.correo);

    return { user: { ...safeUser, id: String(safeUser.id) }, ...tokens };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, correo: true },
      });

      if (!user) throw new UnauthorizedException('Token inválido');

      const { accessToken } = this.generateTokens(user.id, user.correo);
      return { accessToken };
    } catch {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }
  }

  private generateTokens(userId: number, correo: string) {
    const payload = { sub: userId, correo };
    const secret = this.configService.get<string>('JWT_SECRET');

    const accessToken = this.jwtService.sign(payload, { secret, expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { secret, expiresIn: '7d' });

    return { accessToken, refreshToken };
  }

  private async sendBrevoEmail(
    email: string,
    nombre: string,
    type: 'welcome' | 'goal_created' | 'goal_completed',
  ) {
    const apiKey = this.configService.get<string>('BREVO_API_KEY');
    if (!apiKey) return;

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
    } catch {
      // Non-critical
    }
  }
}

