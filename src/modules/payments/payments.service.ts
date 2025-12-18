import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus } from '../../entities/payment.entity';
import { TransactionStatus } from '../../entities/transaction-status.entity';
import { FeeBill, FeeBillStatus } from '../../entities/fee-bill.entity';
import { CreatePaymentDto, UpdatePaymentDto } from './dto/create-payment.dto';
import { PaginationDto, PaginatedResponse } from '../../common/dto/pagination.dto';

// Payments service - processes payments, updates fee bill status, and tracks transaction history
@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(TransactionStatus)
    private transactionStatusRepository: Repository<TransactionStatus>,
    @InjectRepository(FeeBill)
    private feeBillRepository: Repository<FeeBill>,
  ) {}

  async create(createPaymentDto: CreatePaymentDto, userSchoolId?: string) {
    if (userSchoolId && createPaymentDto.school_id !== userSchoolId) {
      throw new ForbiddenException('Cannot create payment for different school');
    }

    const payment = this.paymentRepository.create({
      ...createPaymentDto,
      initiated_at: createPaymentDto.initiated_at
        ? new Date(createPaymentDto.initiated_at)
        : new Date(),
      completed_at: createPaymentDto.completed_at
        ? new Date(createPaymentDto.completed_at)
        : createPaymentDto.status === PaymentStatus.SUCCESS
          ? new Date()
          : null,
    });

    const savedPayment = await this.paymentRepository.save(payment);

    // Create transaction status record
    await this.transactionStatusRepository.save({
      payment_id: savedPayment.id,
      status: savedPayment.status,
      changed_at: new Date(),
      notes: 'Payment created',
    });

    // Update fee bill status if linked
    if (savedPayment.fee_bill_id) {
      await this.updateFeeBillStatus(savedPayment.fee_bill_id);
    }

    return savedPayment;
  }

  async findAll(
    pagination: PaginationDto,
    userSchoolId?: string,
    filters?: { student_id?: string; status?: string; method?: string },
  ): Promise<PaginatedResponse<Payment>> {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const query = this.paymentRepository.createQueryBuilder('payment');

    // Build WHERE conditions
    const conditions: string[] = [];
    const params: any = {};

    if (userSchoolId) {
      conditions.push('payment.school_id = :schoolId');
      params.schoolId = userSchoolId;
    }

    if (filters?.student_id) {
      conditions.push('payment.student_id = :studentId');
      params.studentId = filters.student_id;
    }

    if (filters?.status) {
      conditions.push('payment.status = :status');
      params.status = filters.status;
    }

    if (filters?.method) {
      conditions.push('payment.method = :method');
      params.method = filters.method;
    }

    // Apply WHERE conditions
    if (conditions.length > 0) {
      query.where(conditions.join(' AND '), params);
    }

    const [data, total] = await query
      .leftJoinAndSelect('payment.student', 'student')
      .leftJoinAndSelect('payment.feeBill', 'feeBill')
      .skip(skip)
      .take(limit)
      .orderBy('payment.completed_at', 'DESC')
      .addOrderBy('payment.created_at', 'DESC')
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, userSchoolId?: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['student', 'school', 'feeBill', 'transactionStatuses'],
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    if (userSchoolId && payment.school_id !== userSchoolId) {
      throw new ForbiddenException('Access denied');
    }

    return payment;
  }

  async update(
    id: string,
    updatePaymentDto: UpdatePaymentDto,
    userSchoolId?: string,
  ): Promise<Payment> {
    const payment = await this.findOne(id, userSchoolId);
    const oldStatus = payment.status;

    if (updatePaymentDto.completed_at) {
      updatePaymentDto.completed_at = new Date(updatePaymentDto.completed_at).toISOString();
    }

    Object.assign(payment, updatePaymentDto);
    const savedPayment = await this.paymentRepository.save(payment);

    // Create transaction status record if status changed
    if (updatePaymentDto.status && updatePaymentDto.status !== oldStatus) {
      await this.transactionStatusRepository.save({
        payment_id: savedPayment.id,
        status: savedPayment.status,
        changed_at: new Date(),
        notes: `Status changed from ${oldStatus} to ${savedPayment.status}`,
      });

      // Update fee bill status if linked
      if (savedPayment.fee_bill_id) {
        await this.updateFeeBillStatus(savedPayment.fee_bill_id);
      }
    }

    return savedPayment;
  }

  async remove(id: string, userSchoolId?: string): Promise<void> {
    const payment = await this.findOne(id, userSchoolId);
    await this.paymentRepository.remove(payment);
  }

  private async updateFeeBillStatus(feeBillId: string) {
    const feeBill = await this.feeBillRepository.findOne({
      where: { id: feeBillId },
      relations: ['payments'],
    });

    if (!feeBill) {
      return;
    }

    const totalPaid = feeBill.payments
      .filter((p) => p.status === PaymentStatus.SUCCESS)
      .reduce((sum, p) => sum + parseFloat(p.amount_paid.toString()), 0);

    const amountDue = parseFloat(feeBill.amount_due.toString());

    if (totalPaid >= amountDue) {
      feeBill.status = FeeBillStatus.PAID;
    } else if (totalPaid > 0) {
      feeBill.status = FeeBillStatus.PARTIAL;
    } else {
      feeBill.status = FeeBillStatus.DUE;
    }

    await this.feeBillRepository.save(feeBill);
  }
}
