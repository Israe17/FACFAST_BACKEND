import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Canton } from './canton.entity';

@Entity('districts')
@Index(['canton_id', 'code'], { unique: true })
export class District {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  canton_id!: number;

  @ManyToOne(() => Canton, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'canton_id' })
  canton?: Canton;

  @Column({ type: 'varchar', length: 8 })
  code!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;
}
