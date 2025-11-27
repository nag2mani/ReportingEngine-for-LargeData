import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Student } from './student.entity';
import { FeeBill } from './fee-bill.entity';
import { Payment } from './payment.entity';

@Entity('schools')
export class School {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  timezone: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  region: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @OneToMany(() => Student, (student) => student.school)
  students: Student[];

  @OneToMany(() => FeeBill, (feeBill) => feeBill.school)
  feeBills: FeeBill[];

  @OneToMany(() => Payment, (payment) => payment.school)
  payments: Payment[];
}
