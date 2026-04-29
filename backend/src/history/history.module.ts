import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HistoryController } from './history.controller';
import { HistoryService } from './history.service';
import { AlignmentHistory } from './entities/alignment-history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AlignmentHistory])],
  controllers: [HistoryController],
  providers: [HistoryService],
})
export class HistoryModule {}
