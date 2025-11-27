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
import { FeeBill } from './fee-bill.entity';
import { Payment } from './payment.entity';

@Entity('students')
@Index(['school_id', 'student_number'], { unique: true })
@Index(['school_id', 'class'])
export class Student {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'school_id' })
  school_id: string;

  @ManyToOne(() => School, (school) => school.students)
  @JoinColumn({ name: 'school_id' })
  school: School;

  @Column({ type: 'varchar', length: 100 })
  student_number: string;

  @Column({ type: 'varchar', length: 100 })
  first_name: string;

  @Column({ type: 'varchar', length: 100 })
  last_name: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  class: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  section: string;

  @Column({ type: 'date', nullable: true })
  admission_date: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'jsonb', nullable: true })
  meta: any;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @OneToMany(() => FeeBill, (feeBill) => feeBill.student)
  feeBills: FeeBill[];

  @OneToMany(() => Payment, (payment) => payment.student)
  payments: Payment[];
}
