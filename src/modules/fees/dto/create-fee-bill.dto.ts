import {
  IsUUID,
  IsNumber,
  IsDateString,
  IsString,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { FeeBillStatus } from '../../../entities/fee-bill.entity';

export class CreateFeeBillDto {
  @IsUUID()
  school_id: string;

  @IsUUID()
  student_id: string;

  @IsNumber()
  amount_due: number;

  @IsDateString()
  due_date: string;

  @IsString()
  period: string;

  @IsOptional()
  @IsEnum(FeeBillStatus)
  status?: FeeBillStatus;

  @IsOptional()
  meta?: any;
}

export class UpdateFeeBillDto {
  @IsOptional()
  @IsNumber()
  amount_due?: number;

  @IsOptional()
  @IsDateString()
  due_date?: string;

  @IsOptional()
  @IsEnum(FeeBillStatus)
  status?: FeeBillStatus;

  @IsOptional()
  meta?: any;
}
