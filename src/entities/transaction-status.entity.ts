import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { Payment } from './payment.entity';

@Entity('transaction_status')
@Index(['payment_id'])
@Index(['changed_at'])
export class TransactionStatus {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'payment_id' })
  payment_id: string;

  @ManyToOne(() => Payment, (payment) => payment.transactionStatuses)
  @JoinColumn({ name: 'payment_id' })
  payment: Payment;

  @Column({ type: 'varchar', length: 50 })
  status: string;

  @Column({ type: 'timestamptz' })
  changed_at: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
