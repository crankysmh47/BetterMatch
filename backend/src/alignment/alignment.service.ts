import { Injectable, BadGatewayException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { AlignDto } from './dto/align.dto';
import { AlignmentHistory } from '../history/entities/alignment-history.entity';

@Injectable()
export class AlignmentService {
  private readonly algoBase: string;

  constructor(
    private readonly http: HttpService,
    @InjectRepository(AlignmentHistory)
    private readonly historyRepo: Repository<AlignmentHistory>,
  ) {
    this.algoBase = process.env.ALGO_SERVICE_URL ?? 'http://localhost:8000';
  }

  async alignGlobal(dto: AlignDto) {
    return this.callAndPersist(`${this.algoBase}/api/align/global`, dto);
  }

  async alignLocal(dto: AlignDto) {
    return this.callAndPersist(`${this.algoBase}/api/align/local`, dto);
  }

  async alignOptimized(dto: AlignDto) {
    return this.callAndPersist(`${this.algoBase}/api/align/optimized`, dto);
  }

  async alignAll(dto: AlignDto) {
    try {
      const { data } = await firstValueFrom(
        this.http.post(`${this.algoBase}/api/align/all`, dto),
      );
      // Persist all three in parallel
      await Promise.all([
        this.persist(data.needleman_wunsch, dto),
        this.persist(data.smith_waterman, dto),
        this.persist(data.hirschberg, dto),
      ]);
      return data;
    } catch (err) {
      throw new BadGatewayException(
        `Algorithm service error: ${err?.response?.data?.detail ?? err.message}`,
      );
    }
  }

  private async callAndPersist(url: string, dto: AlignDto) {
    try {
      const { data } = await firstValueFrom(this.http.post(url, dto));
      await this.persist(data, dto);
      return data;
    } catch (err) {
      throw new BadGatewayException(
        `Algorithm service error: ${err?.response?.data?.detail ?? err.message}`,
      );
    }
  }

  private async persist(result: any, dto: AlignDto) {
    const record = this.historyRepo.create({
      algorithm: result.algorithm,
      seq_a: dto.seq_a,
      seq_b: dto.seq_b,
      match_score: dto.match ?? 1,
      mismatch_penalty: dto.mismatch ?? -1,
      gap_penalty: dto.gap ?? -2,
      use_blosum62: dto.use_blosum62 ?? false,
      result_score: result.score,
      aligned_a: result.aligned_a,
      aligned_b: result.aligned_b,
      identity: result.identity,
      matches: result.matches,
      mismatches: result.mismatches,
      gaps: result.gaps,
      elapsed_ms: result.elapsed_ms,
      peak_memory_kb: result.peak_memory_kb,
    });
    await this.historyRepo.save(record);
  }
}
