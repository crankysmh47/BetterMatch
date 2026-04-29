import { Controller, Post, Body } from '@nestjs/common';
import { AlignmentService } from './alignment.service';
import { AlignDto } from './dto/align.dto';

@Controller('align')
export class AlignmentController {
  constructor(private readonly alignmentService: AlignmentService) {}

  @Post('global')
  alignGlobal(@Body() dto: AlignDto) {
    return this.alignmentService.alignGlobal(dto);
  }

  @Post('local')
  alignLocal(@Body() dto: AlignDto) {
    return this.alignmentService.alignLocal(dto);
  }

  @Post('optimized')
  alignOptimized(@Body() dto: AlignDto) {
    return this.alignmentService.alignOptimized(dto);
  }

  @Post('all')
  alignAll(@Body() dto: AlignDto) {
    return this.alignmentService.alignAll(dto);
  }
}
