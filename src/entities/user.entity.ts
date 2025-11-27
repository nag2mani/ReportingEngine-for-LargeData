import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { Role } from './role.entity';
import { School } from './school.entity';

@Entity('users')
@Index(['email'], { unique: true })
@Index(['school_id'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  hashed_password: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'uuid', name: 'school_id', nullable: true })
  school_id: string;

  @ManyToOne(() => School, { nullable: true })
  @JoinColumn({ name: 'school_id' })
  school: School;

  @Column({ type: 'uuid', name: 'role_id' })
  role_id: string;

  @ManyToOne(() => Role, (role) => role.users)
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
