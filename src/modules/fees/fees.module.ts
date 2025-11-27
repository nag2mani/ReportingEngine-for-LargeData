import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeesService } from './fees.service';
import { FeesController } from './fees.controller';
import { FeeBill } from '../../entities/fee-bill.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FeeBill])],
  controllers: [FeesController],
  providers: [FeesService],
  exports: [FeesService],
})
export class FeesModule {}
