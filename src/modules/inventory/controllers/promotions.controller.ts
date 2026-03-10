import {
  ApiBody,
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { PermissionKey } from '../../common/enums/permission-key.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import type { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { CreatePromotionDto } from '../dto/create-promotion.dto';
import { UpdatePromotionDto } from '../dto/update-promotion.dto';
import { PromotionsService } from '../services/promotions.service';

@ApiTags('promotions')
@ApiCookieAuth('access-cookie')
@ApiUnauthorizedResponse({ description: 'Access token invalido o ausente.' })
@ApiForbiddenResponse({ description: 'Permisos insuficientes.' })
@Controller('promotions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PromotionsController {
  constructor(private readonly promotions_service: PromotionsService) {}

  @Get()
  @RequirePermissions(PermissionKey.PROMOTIONS_VIEW)
  @ApiOperation({ summary: 'Listar promociones' })
  get_promotions(@CurrentUser() current_user: AuthenticatedUserContext) {
    return this.promotions_service.get_promotions(current_user);
  }

  @Post()
  @RequirePermissions(PermissionKey.PROMOTIONS_CREATE)
  @ApiOperation({ summary: 'Crear promocion' })
  @ApiBody({ type: CreatePromotionDto })
  create_promotion(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Body() dto: CreatePromotionDto,
  ) {
    return this.promotions_service.create_promotion(current_user, dto);
  }

  @Get(':id')
  @RequirePermissions(PermissionKey.PROMOTIONS_VIEW)
  @ApiOperation({ summary: 'Obtener promocion por id' })
  @ApiParam({ name: 'id', type: Number })
  get_promotion(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) promotion_id: number,
  ) {
    return this.promotions_service.get_promotion(current_user, promotion_id);
  }

  @Patch(':id')
  @RequirePermissions(PermissionKey.PROMOTIONS_UPDATE)
  @ApiOperation({ summary: 'Actualizar promocion' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdatePromotionDto })
  update_promotion(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) promotion_id: number,
    @Body() dto: UpdatePromotionDto,
  ) {
    return this.promotions_service.update_promotion(
      current_user,
      promotion_id,
      dto,
    );
  }
}
