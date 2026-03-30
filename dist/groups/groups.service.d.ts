import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { JoinGroupDto } from './dto/join-group.dto';
import { ContributeDto } from './dto/contribute.dto';
export declare class GroupsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getAll(userId: number): Promise<any[]>;
    create(userId: number, dto: CreateGroupDto): Promise<any>;
    getDetail(groupId: number, currentUserId: number): Promise<{
        id: string;
        nombre: string;
        metaAhorro: number;
        inviteCode: string;
        liderId: string;
        createdAt: Date;
        totalAcumulado: number;
        porcentajeGrupal: number;
        miembros: {
            rank: number;
