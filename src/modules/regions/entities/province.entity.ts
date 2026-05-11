import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Country } from './country.entity';

@Entity('provinces')
@Index(['country_id', 'code'], { unique: true })
export class Province {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  country_id!: number;

  @ManyToOne(() => Country, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'country_id' })
  country?: Country;

  @Column({ type: 'varchar', length: 8 })
  code!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;
}
