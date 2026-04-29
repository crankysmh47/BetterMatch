import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlignmentHistory } from './entities/alignment-history.entity';

@Injectable()
export class HistoryService {
  constructor(
    @InjectRepository(AlignmentHistory)
    private readonly repo: Repository<AlignmentHistory>,
  ) {}

  findAll(limit = 20) {
    return this.repo.find({
      order: { created_at: 'DESC' },
      take: limit,
    });
  }

  findOne(id: string) {
    return this.repo.findOneByOrFail({ id });
  }

  async remove(id: string) {
    await this.repo.delete(id);
    return { deleted: true };
  }

  async stats() {
    const total = await this.repo.count();
    const byAlgo = await this.repo
      .createQueryBuilder('h')
      .select('h.algorithm', 'algorithm')
      .addSelect('COUNT(*)', 'count')
      .addSelect('AVG(h.elapsed_ms)', 'avg_ms')
      .addSelect('AVG(h.peak_memory_kb)', 'avg_kb')
      .groupBy('h.algorithm')
      .getRawMany();
    return { total, by_algorithm: byAlgo };
  }
}
