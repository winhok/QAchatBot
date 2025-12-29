import { LoggerService } from '@/infrastructure/logger/logger.service';
import type { SessionStatus, SessionType } from '@/shared/schemas/enums';
import type {
  CreateSessionRequest,
  UpdateSessionRequest,
} from '@/shared/schemas/requests';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SessionsService {
  private readonly className = 'SessionsService';

  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
  ) {}

  async create(dto: CreateSessionRequest) {
    const result = await this.prisma.session.create({
      data: {
        ...(dto.id && { id: dto.id }),
        name: dto.name ?? '',
        type: dto.type,
      },
    });
    this.logger.logQueryResult(this.className, 'create', result);
    return result;
  }

  async findOrCreate(id: string, type: SessionType = 'normal') {
    const existing = await this.prisma.session.findUnique({ where: { id } });
    this.logger.logQueryResult(this.className, 'findOrCreate.find', existing);
    if (existing) return existing;

    const result = await this.prisma.session.create({
      data: { id, type },
    });
    this.logger.logQueryResult(this.className, 'findOrCreate.create', result);
    return result;
  }

  async findAll(status?: SessionStatus) {
    const result = await this.prisma.session.findMany({
      where: status ? { status } : { status: { not: 'deleted' } },
      orderBy: { lastMessageAt: { sort: 'desc', nulls: 'last' } },
      include: {
        messages: {
          orderBy: { seq: 'desc' },
          take: 1,
          select: { content: true, role: true, createdAt: true },
        },
      },
    });
    this.logger.logQueryResult(this.className, 'findAll', result);
    return result;
  }

  async findByType(type: SessionType, status?: SessionStatus) {
    const result = await this.prisma.session.findMany({
      where: {
        type,
        status: status ?? { not: 'deleted' },
      },
      orderBy: { lastMessageAt: { sort: 'desc', nulls: 'last' } },
      include: {
        messages: {
          orderBy: { seq: 'desc' },
          take: 1,
          select: { content: true, role: true, createdAt: true },
        },
      },
    });
    this.logger.logQueryResult(this.className, 'findByType', result);
    return result;
  }

  async findOne(id: string) {
    const result = await this.prisma.session.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { seq: 'asc' },
          include: {
            toolCalls: {
              orderBy: { seq: 'asc' },
            },
          },
        },
      },
    });
    this.logger.logQueryResult(this.className, 'findOne', result);
    return result;
  }

  async update(id: string, dto: Omit<UpdateSessionRequest, 'id'>) {
    const result = await this.prisma.session.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
    });
    this.logger.logQueryResult(this.className, 'update', result);
    return result;
  }

  async archive(id: string) {
    const result = await this.prisma.session.update({
      where: { id },
      data: { status: 'archived' },
    });
    this.logger.logQueryResult(this.className, 'archive', result);
    return result;
  }

  async remove(id: string) {
    const result = await this.prisma.session.update({
      where: { id },
      data: { status: 'deleted' },
    });
    this.logger.logQueryResult(this.className, 'remove', result);
    return result;
  }

  async hardDelete(id: string) {
    const result = await this.prisma.session.delete({
      where: { id },
    });
    this.logger.logQueryResult(this.className, 'hardDelete', result);
    return result;
  }

  async updateLastMessageAt(id: string) {
    const result = await this.prisma.session.update({
      where: { id },
      data: { lastMessageAt: new Date() },
    });
    this.logger.logQueryResult(this.className, 'updateLastMessageAt', result);
    return result;
  }
}
