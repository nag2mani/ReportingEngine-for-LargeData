import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { FeeBill } from '../../entities/fee-bill.entity';
import { Payment } from '../../entities/payment.entity';
import { Student } from '../../entities/student.entity';
import { School } from '../../entities/school.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([FeeBill, Payment, Student, School]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
