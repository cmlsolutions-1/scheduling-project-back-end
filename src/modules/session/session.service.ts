import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Session } from './entity/session.entity';
import { Repository } from 'typeorm';


@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepo: Repository<Session>,
  ) {}

  async create(data: Partial<Session>): Promise<Session> {
    const session = this.sessionRepo.create(data);
    return this.sessionRepo.save(session);
  }

  async findById(id: string) {
    return this.sessionRepo.findOne({
      where: { id, isActive: true },
      relations: ['user'],
    });
  }

  async invalidate(sessionId: string) {
    await this.sessionRepo.update(
      { id: sessionId },
      { isActive: false },
    );
  }

  async invalidateAll(userId: string) {
    await this.sessionRepo.update(
      { user: { id: userId } },
      { isActive: false },
    );
  }
}