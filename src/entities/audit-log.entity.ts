import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('audit_logs')
@Index(['user_id'])
@Index(['resource', 'resource_id'])
@Index(['created_at'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id', nullable: true })
  user_id: string;

  @Column({ type: 'varchar', length: 100 })
  resource: string;

  @Column({ type: 'uuid', name: 'resource_id', nullable: true })
  resource_id: string;

  @Column({ type: 'varchar', length: 50 })
  action: string;

  @Column({ type: 'jsonb', nullable: true })
  changes: any;

  @Column({ type: 'varchar', length: 50, nullable: true })
  ip_address: string;

  @Column({ type: 'text', nullable: true })
  user_agent: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
