import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { Role } from './role.entity';

export enum Resource {
  STUDENTS = 'students',
  FEE_BILLS = 'fee_bills',
  PAYMENTS = 'payments',
  REPORTS = 'reports',
  SCHOOLS = 'schools',
  USERS = 'users',
}

export enum Action {
  READ = 'read',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
}

@Entity('permissions')
@Index(['role_id', 'resource', 'action'], { unique: true })
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'role_id' })
  role_id: string;

  @ManyToOne(() => Role, (role) => role.permissions)
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @Column({
    type: 'enum',
    enum: Resource,
  })
  resource: Resource;

  @Column({
    type: 'enum',
    enum: Action,
  })
  action: Action;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
