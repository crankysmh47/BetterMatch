import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsBoolean,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AlignDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  seq_a: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  seq_b: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  match?: number = 1;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  mismatch?: number = -1;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  gap?: number = -2;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  use_blosum62?: boolean = false;
}
