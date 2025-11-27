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
import { Resource } from './permission.entity';

@Entity('field_permissions')
@Index(['role_id', 'resource', 'field_name'], { unique: true })
export class FieldPermission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'role_id' })
  role_id: string;

  @ManyToOne(() => Role, (role) => role.fieldPermissions)
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @Column({
    type: 'enum',
    enum: Resource,
  })
  resource: Resource;

  @Column({ type: 'varchar', length: 100 })
  field_name: string;

  @Column({ type: 'jsonb' })
  allowed_actions: string[];

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
