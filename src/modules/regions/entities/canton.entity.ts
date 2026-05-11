import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Province } from './province.entity';

@Entity('cantons')
@Index(['province_id', 'code'], { unique: true })
export class Canton {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  province_id!: number;

  @ManyToOne(() => Province, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'province_id' })
  province?: Province;

  @Column({ type: 'varchar', length: 8 })
  code!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;
}
