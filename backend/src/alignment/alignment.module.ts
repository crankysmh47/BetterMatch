import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlignmentController } from './alignment.controller';
import { AlignmentService } from './alignment.service';
import { AlignmentHistory } from '../history/entities/alignment-history.entity';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([AlignmentHistory]),
  ],
  controllers: [AlignmentController],
  providers: [AlignmentService],
})
export class AlignmentModule {}
