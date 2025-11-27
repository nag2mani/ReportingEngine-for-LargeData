import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { Payment } from '../../entities/payment.entity';
import { TransactionStatus } from '../../entities/transaction-status.entity';
import { FeeBill } from '../../entities/fee-bill.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, TransactionStatus, FeeBill])],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
