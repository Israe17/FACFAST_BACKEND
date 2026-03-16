import {
  ApiBody,
  ApiCookieAuth,
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
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AllowPlatformPermissionOverride } from '../../common/decorators/allow-platform-permission-override.decorator';
import { AllowPlatformTenantContext } from '../../common/decorators/allow-platform-tenant-context.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { PermissionKey } from '../../common/enums/permission-key.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { TenantContextGuard } from '../../common/guards/tenant-context.guard';
import type { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { CreateProductCategoryDto } from '../dto/create-product-category.dto';
import { UpdateProductCategoryDto } from '../dto/update-product-category.dto';
import { ProductCategoriesService } from '../services/product-categories.service';

@ApiTags('product-categories')
@ApiCookieAuth('access-cookie')
@ApiUnauthorizedResponse({ description: 'Access token invalido o ausente.' })
@ApiForbiddenResponse({ description: 'Permisos insuficientes.' })
@Controller('product-categories')
@AllowPlatformPermissionOverride()
@AllowPlatformTenantContext()
@UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
export class ProductCategoriesController {
  constructor(
    private readonly product_categories_service: ProductCategoriesService,
  ) {}

  @Get()
  @RequirePermissions(PermissionKey.CATEGORIES_VIEW)
  @ApiOperation({ summary: 'Listar categorias del negocio autenticado' })
  @ApiOkResponse({ description: 'Lista de categorias.' })
  get_categories(@CurrentUser() current_user: AuthenticatedUserContext) {
    return this.product_categories_service.get_categories(current_user);
  }

  @Post()
  @RequirePermissions(PermissionKey.CATEGORIES_CREATE)
  @ApiOperation({ summary: 'Crear categoria o subcategoria' })
  @ApiBody({ type: CreateProductCategoryDto })
  create_category(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Body() dto: CreateProductCategoryDto,
  ) {
    return this.product_categories_service.create_category(current_user, dto);
  }

  @Get('tree')
  @RequirePermissions(PermissionKey.CATEGORIES_VIEW)
  @ApiOperation({ summary: 'Obtener arbol jerarquico de categorias' })
  get_tree(@CurrentUser() current_user: AuthenticatedUserContext) {
    return this.product_categories_service.get_tree(current_user);
  }

  @Get(':id')
  @RequirePermissions(PermissionKey.CATEGORIES_VIEW)
  @ApiOperation({ summary: 'Obtener categoria por id' })
  @ApiParam({ name: 'id', type: Number })
  get_category(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) category_id: number,
  ) {
    return this.product_categories_service.get_category(
      current_user,
      category_id,
    );
  }

  @Patch(':id')
  @RequirePermissions(PermissionKey.CATEGORIES_UPDATE)
  @ApiOperation({ summary: 'Actualizar categoria' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateProductCategoryDto })
  update_category(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) category_id: number,
    @Body() dto: UpdateProductCategoryDto,
  ) {
    return this.product_categories_service.update_category(
      current_user,
      category_id,
      dto,
    );
  }
}
