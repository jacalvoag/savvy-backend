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

