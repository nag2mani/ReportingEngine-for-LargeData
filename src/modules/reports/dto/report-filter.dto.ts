import { IsOptional, IsUUID, IsEnum, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '../../../entities/payment.entity';

export class ReportFilterDto {
  @IsOptional()
  @IsUUID()
  school_id?: string;

  @IsOptional()
  @IsUUID()
  student_id?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsEnum(PaymentMethod)
  method?: PaymentMethod;

  @IsOptional()
  @Type(() => Number)
  period_months?: number = 1;
}

export class TimeSeriesFilterDto extends ReportFilterDto {
  @IsOptional()
  @Type(() => String)
  interval?: 'day' | 'week' | 'month' = 'day';
}
