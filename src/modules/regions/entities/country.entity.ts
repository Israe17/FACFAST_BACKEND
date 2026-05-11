import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('countries')
@Index(['code'], { unique: true })
export class Country {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: 'varchar',
    length: 2,
  })
  code!: string;

  @Column({
    type: 'varchar',
    length: 120,
  })
  name!: string;
}
