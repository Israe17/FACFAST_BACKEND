import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { DispatchExpenseType } from '../enums/dispatch-expense-type.enum';

export class CreateDispatchExpenseDto {
  @ApiProperty({ example: 'fuel', enum: DispatchExpenseType })
  @IsEnum(DispatchExpenseType)
  expense_type!: DispatchExpenseType;

  @ApiPropertyOptional({ example: 'Fuel for delivery route' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 25000 })
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiPropertyOptional({ example: 'REC-001' })
  @IsOptional()
  @IsString()
  receipt_number?: string;

  @ApiPropertyOptional({ example: 'Paid in cash' })
  @IsOptional()
  @IsString()
  notes?: string;
}
