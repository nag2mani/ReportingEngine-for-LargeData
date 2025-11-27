import {
  IsUUID,
  IsNumber,
  IsEnum,
  IsOptional,
  IsString,
  IsDateString,
} from 'class-validator';
import { PaymentMethod, PaymentStatus } from '../../../entities/payment.entity';

export class CreatePaymentDto {
  @IsUUID()
  @IsOptional()
  fee_bill_id?: string;

  @IsUUID()
  school_id: string;

  @IsUUID()
  student_id: string;

  @IsNumber()
  amount_paid: number;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsOptional()
  @IsString()
  payment_provider?: string;

  @IsOptional()
  @IsString()
  provider_txn_id?: string;

  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @IsOptional()
  @IsDateString()
  initiated_at?: string;

  @IsOptional()
  @IsDateString()
  completed_at?: string;

  @IsOptional()
  metadata?: any;
}

export class UpdatePaymentDto {
  @IsOptional()
  @IsNumber()
  amount_paid?: number;

  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @IsOptional()
  @IsDateString()
  completed_at?: string;

  @IsOptional()
  metadata?: any;
}
