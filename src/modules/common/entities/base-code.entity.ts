import { Column, PrimaryGeneratedColumn } from 'typeorm';

export abstract class BaseCodeEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: 'varchar',
    length: 32,
    unique: true,
    nullable: true,
  })
  code!: string | null;
}
