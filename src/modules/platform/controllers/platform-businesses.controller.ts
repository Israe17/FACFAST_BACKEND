import {
  ApiBody,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
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
  Post,
  UseGuards,
} from '@nestjs/common';
import { CreateBusinessOnboardingDto } from '../../businesses/dto/create-business-onboarding.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PlatformAdminGuard } from '../../common/guards/platform-admin.guard';
import { PlatformBusinessesService } from '../services/platform-businesses.service';

@ApiTags('platform')
@ApiCookieAuth('access-cookie')
@ApiUnauthorizedResponse({ description: 'Access token invalido o ausente.' })
@ApiForbiddenResponse({
  description: 'Privilegios de platform super admin requeridos.',
})
@Controller('platform/businesses')
@UseGuards(JwtAuthGuard, PlatformAdminGuard)
export class PlatformBusinessesController {
  constructor(
    private readonly platform_businesses_service: PlatformBusinessesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas las empresas de la plataforma' })
  @ApiOkResponse({ description: 'Listado global de empresas.' })
  get_businesses() {
    return this.platform_businesses_service.get_businesses();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de una empresa de la plataforma' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'Detalle de la empresa seleccionada.' })
  get_business(@Param('id', ParseIntPipe) business_id: number) {
    return this.platform_businesses_service.get_business(business_id);
  }

  @Get(':id/branches')
  @ApiOperation({
    summary: 'Obtener las sucursales de una empresa seleccionada',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({
    description: 'Listado de sucursales de la empresa seleccionada.',
  })
  get_business_branches(@Param('id', ParseIntPipe) business_id: number) {
    return this.platform_businesses_service.get_business_branches(business_id);
  }

  @Post('onboarding')
  @ApiOperation({
    summary: 'Provisionar un tenant completo desde la capa de plataforma',
  })
  @ApiBody({ type: CreateBusinessOnboardingDto })
  @ApiCreatedResponse({
    description:
      'Crea la empresa, owner, roles base, sucursal inicial y terminal opcional.',
  })
  onboard_business(@Body() dto: CreateBusinessOnboardingDto) {
    return this.platform_businesses_service.onboard_business(dto);
  }
}
