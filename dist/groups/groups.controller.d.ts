import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { JoinGroupDto } from './dto/join-group.dto';
import { ContributeDto } from './dto/contribute.dto';
export declare class GroupsController {
    private readonly groupsService;
    constructor(groupsService: GroupsService);
    getAll(req: any): Promise<any[]>;
    create(req: any, dto: CreateGroupDto): Promise<any>;
    getDetail(req: any, id: number): Promise<{
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
            usuarioId: string;
            nombre: string;
            avatarUrl: string | undefined;
            contribucion: number;
            porcentaje: number;
            streakWeeks: number;
            isCurrentUser: boolean;
        }[];
    }>;
    join(req: any, dto: JoinGroupDto): Promise<any>;
    contribute(req: any, id: number, dto: ContributeDto): Promise<{
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
            usuarioId: string;
            nombre: string;
            avatarUrl: string | undefined;
            contribucion: number;
            porcentaje: number;
            streakWeeks: number;
            isCurrentUser: boolean;
        }[];
    }>;
    deleteGroup(req: any, id: number): Promise<{
        message: string;
    }>;
    leaveGroup(req: any, id: number): Promise<{
        message: string;
    }>;
}

