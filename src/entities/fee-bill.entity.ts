import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { School } from './school.entity';
import { Student } from './student.entity';
import { Payment } from './payment.entity';

export enum FeeBillStatus {
  DUE = 'due',
  PARTIAL = 'partial',
  PAID = 'paid',
  OVERDUE = 'overdue',
}

@Entity('fee_bills')
@Index(['school_id', 'due_date'])
@Index(['student_id'])
@Index(['status'])
export class FeeBill {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'school_id' })
  school_id: string;

  @ManyToOne(() => School, (school) => school.feeBills)
  @JoinColumn({ name: 'school_id' })
  school: School;

  @Column({ type: 'uuid', name: 'student_id' })
  student_id: string;

  @ManyToOne(() => Student, (student) => student.feeBills)
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount_due: number;

  @Column({ type: 'date' })
  due_date: Date;

  @Column({ type: 'varchar', length: 50 })
  period: string;

  @Column({
    type: 'enum',
    enum: FeeBillStatus,
    default: FeeBillStatus.DUE,
  })
  status: FeeBillStatus;

  @Column({ type: 'jsonb', nullable: true })
  meta: any;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @OneToMany(() => Payment, (payment) => payment.feeBill)
  payments: Payment[];
}
