import { PartialType } from '@nestjs/swagger';
import { CreateSaleOrderDto } from './create-sale-order.dto';

export class UpdateSaleOrderDto extends PartialType(CreateSaleOrderDto) {}
