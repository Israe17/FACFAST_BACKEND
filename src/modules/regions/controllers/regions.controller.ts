import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RegionsService } from '../services/regions.service';

@ApiTags('regions')
@ApiCookieAuth('access-cookie')
@ApiUnauthorizedResponse({ description: 'Access token invalido o ausente.' })
@Controller('regions')
@UseGuards(JwtAuthGuard)
export class RegionsController {
  constructor(private readonly regions_service: RegionsService) {}

  @Get('countries')
  @ApiOperation({ summary: 'Listar paises disponibles' })
  @ApiOkResponse({ description: 'Lista de paises.' })
  list_countries() {
    return this.regions_service.list_countries();
  }

  @Get('countries/:country_id/provinces')
  @ApiOperation({ summary: 'Listar provincias de un pais' })
  @ApiParam({ name: 'country_id', type: Number })
  @ApiOkResponse({ description: 'Lista de provincias.' })
  list_provinces(@Param('country_id', ParseIntPipe) country_id: number) {
    return this.regions_service.list_provinces(country_id);
  }

  @Get('provinces/:province_id/cantons')
  @ApiOperation({ summary: 'Listar cantones de una provincia' })
  @ApiParam({ name: 'province_id', type: Number })
  @ApiOkResponse({ description: 'Lista de cantones.' })
  list_cantons(@Param('province_id', ParseIntPipe) province_id: number) {
    return this.regions_service.list_cantons(province_id);
  }

  @Get('cantons/:canton_id/districts')
  @ApiOperation({ summary: 'Listar distritos de un canton' })
  @ApiParam({ name: 'canton_id', type: Number })
  @ApiOkResponse({ description: 'Lista de distritos.' })
  list_districts(@Param('canton_id', ParseIntPipe) canton_id: number) {
    return this.regions_service.list_districts(canton_id);
  }
}
