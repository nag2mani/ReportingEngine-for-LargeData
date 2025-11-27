import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { School } from './school.entity';
import { Student } from './student.entity';
import { FeeBill } from './fee-bill.entity';
import { TransactionStatus } from './transaction-status.entity';

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  UPI = 'upi',
  NETBANKING = 'netbanking',
  CHEQUE = 'cheque',
  WALLET = 'wallet',
}

export enum PaymentStatus {
  INITIATED = 'initiated',
  SUCCESS = 'success',
  FAILED = 'failed',
  REVERSED = 'reversed',
}

@Entity('payments')
@Index(['school_id', 'completed_at'])
@Index(['provider_txn_id'], { unique: true, where: '"provider_txn_id" IS NOT NULL' })
@Index(['fee_bill_id'])
@Index(['status'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'fee_bill_id', nullable: true })
  fee_bill_id: string;

  @ManyToOne(() => FeeBill, (feeBill) => feeBill.payments, { nullable: true })
  @JoinColumn({ name: 'fee_bill_id' })
  feeBill: FeeBill;

  @Column({ type: 'uuid', name: 'school_id' })
  school_id: string;

  @ManyToOne(() => School, (school) => school.payments)
  @JoinColumn({ name: 'school_id' })
  school: School;

  @Column({ type: 'uuid', name: 'student_id' })
  student_id: string;

  @ManyToOne(() => Student, (student) => student.payments)
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount_paid: number;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
  })
  method: PaymentMethod;

  @Column({ type: 'varchar', length: 100, nullable: true })
  payment_provider: string;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  provider_txn_id: string;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.INITIATED,
  })
  status: PaymentStatus;

  @Column({ type: 'timestamptz', nullable: true })
  initiated_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  completed_at: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @OneToMany(() => TransactionStatus, (status) => status.payment)
  transactionStatuses: TransactionStatus[];
}
