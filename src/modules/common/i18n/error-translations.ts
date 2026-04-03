export const error_translations = {
  es: {
    'errors.internal_server_error': 'Ocurrio un error interno.',
    'errors.bad_request': 'La solicitud no es valida.',
    'errors.unauthorized': 'No autorizado.',
    'errors.forbidden': 'No tienes permiso para realizar esta accion.',
    'errors.not_found': 'No se encontro el recurso solicitado.',
    'errors.conflict': 'La operacion entra en conflicto con el estado actual.',
    'errors.unique_constraint_violation': 'Ya existe un registro con ese valor en ({{fields}}): ({{values}}).',
    'validation.error': 'Hay errores de validacion.',
    'validation.required': 'Este campo es obligatorio.',
    'validation.invalid_string': 'Este valor debe ser un texto valido.',
    'validation.invalid_email': 'El correo electronico no es valido.',
    'validation.min_length':
      'El campo {{field}} debe tener al menos {{min}} caracteres.',
    'validation.max_length':
      'El campo {{field}} no puede exceder {{max}} caracteres.',
    'validation.exact_length':
      'El campo {{field}} debe tener exactamente {{length}} caracteres.',
    'validation.invalid_enum': 'El valor seleccionado no es valido.',
    'validation.invalid_number': 'El valor numerico no es valido.',
    'validation.invalid_boolean': 'El valor booleano no es valido.',
    'validation.invalid_date': 'La fecha no es valida.',
    'validation.min_value':
      'El campo {{field}} debe ser mayor o igual a {{min}}.',
    'validation.max_value':
      'El campo {{field}} debe ser menor o igual a {{max}}.',
    'validation.positive_number': 'El valor debe ser mayor que cero.',
    'validation.array_required': 'Debe enviarse una lista valida.',
    'validation.array_unique': 'La lista contiene valores duplicados.',
    'validation.invalid_uuid': 'El identificador no es valido.',
    'validation.pattern_mismatch': 'El formato del valor no es valido.',
    'validation.invalid_nested_object':
      'La estructura del objeto anidado no es valida.',
    'auth.invalid_credentials': 'Las credenciales son invalidas.',
    'auth.login_forbidden_state':
      'El usuario no puede iniciar sesion en el estado actual.',
    'auth.login_permission_denied':
      'El usuario no tiene permiso para iniciar sesion.',
    'auth.refresh_permission_denied':
      'El usuario no tiene permiso para refrescar la sesion.',
    'auth.access_session_not_found':
      'La sesion de acceso no existe o ya no esta disponible.',
    'auth.access_session_user_mismatch':
      'La sesion de acceso no pertenece al usuario autenticado.',
    'auth.access_session_business_mismatch':
      'La sesion de acceso no pertenece a la empresa autenticada.',
    'auth.access_session_inactive':
      'La sesion de acceso ya no se encuentra activa.',
    'auth.access_token_payload_invalid':
      'El access token no contiene un contexto valido.',
    'auth.refresh_session_not_found':
      'La sesion de refresh no existe o ya no esta disponible.',
    'auth.refresh_session_user_mismatch':
      'La sesion de refresh no pertenece al usuario autenticado.',
    'auth.refresh_session_business_mismatch':
      'La sesion de refresh no pertenece a la empresa autenticada.',
    'auth.refresh_session_inactive':
      'La sesion de refresh ya no se encuentra activa.',
    'auth.refresh_session_revoked': 'La sesion de refresh fue revocada.',
    'auth.refresh_session_expired': 'La sesion de refresh expiro.',
    'auth.refresh_token_mismatch':
      'El refresh token no coincide con la sesion persistida.',
    'auth.refresh_token_payload_invalid':
      'El refresh token no contiene un contexto valido.',
    'auth.context_resolution_failed':
      'No se pudo resolver el contexto autenticado del usuario.',
    'common.entity_code_invalid_format':
      'El codigo no cumple el formato esperado para el prefijo {{prefix}}.',
    'common.entity_code_assignment_conflict':
      'No se pudo asignar un codigo unico para el prefijo {{prefix}}.',
    'common.field_encryption_key_missing':
      'La configuracion de cifrado de campos no esta disponible.',
    'common.encrypted_payload_invalid_format':
      'El valor cifrado no tiene un formato valido.',
    'common.idempotency_key_in_progress':
      'Ya existe una solicitud en proceso con la misma llave de idempotencia.',
    'common.idempotency_key_payload_mismatch':
      'La llave de idempotencia ya fue utilizada con un payload distinto.',
    'businesses.not_found': 'La empresa no existe.',
    'businesses.identification_duplicate':
      'La identificacion de empresa ya existe.',
    'businesses.owner_email_duplicate':
      'El correo del owner ya existe en el sistema.',
    'businesses.owner_role_resolution_failed':
      'No se pudo resolver el rol owner para la nueva empresa.',
    'users.not_found': 'El usuario no existe.',
    'users.email_duplicate': 'El correo electronico ya existe.',
    'users.invalid_roles_for_business':
      'Uno o mas roles no pertenecen a la empresa activa.',
    'users.invalid_branches_for_business':
      'Una o mas sucursales no pertenecen a la empresa activa.',
    'users.system_user_api_forbidden':
      'Los usuarios de sistema no pueden gestionarse desde esta operacion.',
    'users.owner_assignment_forbidden':
      'Solo un owner puede crear o actualizar usuarios owner.',
    'users.cross_business_management_forbidden':
      'No se permite gestionar usuarios de otra empresa.',
    'users.owner_management_forbidden':
      'Solo un owner puede gestionar a otro owner.',
    'users.system_management_forbidden':
      'Los usuarios de sistema no pueden ser gestionados desde este contexto.',
    'users.self_delete_forbidden': 'Un usuario no puede eliminarse a si mismo.',
    'users.platform_admin_delete_forbidden':
      'Los usuarios platform admin no pueden eliminarse desde este contexto.',
    'users.last_owner_delete_forbidden':
      'No se puede eliminar el ultimo usuario owner de la empresa.',
    'users.delete_forbidden':
      'El usuario no puede eliminarse porque tiene historial operativo asociado.',
    'contacts.not_found': 'El contacto no existe.',
    'contacts.code_duplicate': 'El codigo del contacto ya existe.',
    'contacts.identification_duplicate':
      'La identificacion ya existe en esta empresa.',
    'contacts.lookup_multiple':
      'Existe mas de un contacto con esa identificacion en esta empresa.',
    'contacts.delete_forbidden':
      'El contacto no puede eliminarse porque tiene historial operativo asociado.',
    'contacts.branch_assignment_not_found':
      'El assignment del contacto por sucursal no existe.',
    'contacts.branch_assignment_duplicate':
      'Ya existe un assignment de este contacto para la sucursal seleccionada.',
    'contacts.branch_exclusive_conflict':
      'El contacto ya tiene una asignacion exclusiva activa en otra sucursal.',
    'contacts.account_manager_branch_scope_invalid':
      'El encargado asignado no tiene alcance sobre la sucursal seleccionada.',
    'branches.not_found': 'La sucursal no existe.',
    'branches.access_forbidden': 'El usuario no tiene acceso a esta sucursal.',
    'branches.manage_scope_forbidden':
      'El usuario no puede operar sobre una o mas sucursales indicadas.',
    'branches.configuration_permission_required':
      'Se requiere branches.configure para editar configuracion sensible.',
    'branches.delete_forbidden':
      'La sucursal no puede eliminarse porque tiene dependencias operativas asociadas.',
    'terminals.not_found': 'La terminal no existe.',
    'inventory.category_not_found': 'La categoria no existe.',
    'inventory.category_name_duplicate':
      'Ya existe una categoria con ese nombre en el mismo nivel jerarquico.',
    'inventory.category_parent_self_invalid':
      'Una categoria no puede asignarse a si misma como padre.',
    'inventory.category_parent_descendant_invalid':
      'Una categoria no puede moverse debajo de uno de sus descendientes.',
    'inventory.brand_not_found': 'La marca no existe.',
    'inventory.brand_name_duplicate': 'Ya existe una marca con ese nombre.',
    'inventory.measurement_unit_not_found': 'La unidad de medida no existe.',
    'inventory.measurement_unit_name_or_symbol_duplicate':
      'Ya existe una unidad de medida con ese nombre o simbolo.',
    'inventory.tax_profile_not_found': 'El perfil fiscal no existe.',
    'inventory.tax_profile_name_duplicate':
      'Ya existe un perfil fiscal con ese nombre.',
    'inventory.tax_profile_iva_rate_required':
      'Los perfiles fiscales IVA requieren un valor iva_rate.',
    'inventory.tax_profile_specific_fields_required':
      'Los perfiles de impuesto especifico requieren specific_tax_name y specific_tax_rate.',
    'inventory.warranty_profile_not_found': 'El perfil de garantia no existe.',
    'inventory.warranty_profile_name_duplicate':
      'Ya existe un perfil de garantia con ese nombre.',
    'inventory.product_not_found': 'El producto no existe.',
    'inventory.product_sku_duplicate': 'Ya existe un producto con ese SKU.',
    'inventory.product_barcode_duplicate':
      'Ya existe un producto con ese codigo de barras.',
    'inventory.product_tax_profile_goods_required':
      'Los productos de mercancia requieren un perfil fiscal de bienes.',
    'inventory.product_tax_profile_service_required':
      'Los servicios requieren un perfil fiscal de servicios.',
    'inventory.product_inventory_tracking_required':
      'Este producto no soporta seguimiento de inventario.',
    'inventory.product_lot_tracking_requires_inventory':
      'Los productos con seguimiento por lote tambien deben llevar inventario.',
    'inventory.product_expiration_requires_lots':
      'Los productos con vencimiento tambien deben llevar lotes.',
    'inventory.product_warranty_profile_required':
      'Los productos con garantia requieren un perfil de garantia.',
    'inventory.product_lot_tracking_required':
      'Este producto no soporta inventario basado en lotes.',
    'inventory.price_list_not_found': 'La lista de precios no existe.',
    'inventory.price_list_inactive':
      'La lista de precios seleccionada no se encuentra activa.',
    'inventory.price_list_name_duplicate':
      'Ya existe una lista de precios con ese nombre.',
    'inventory.branch_price_list_assignment_not_found':
      'El assignment de lista de precios por sucursal no existe.',
    'inventory.branch_price_list_assignment_duplicate':
      'La lista de precios ya esta asignada a la sucursal seleccionada.',
    'inventory.branch_price_list_default_requires_active_assignment':
      'Solo un assignment activo puede marcarse como default para la sucursal.',
    'inventory.product_price_not_found': 'El precio del producto no existe.',
    'inventory.price_valid_range_invalid':
      'valid_to no puede ser anterior a valid_from.',
    'inventory.promotion_not_found': 'La promocion no existe.',
    'inventory.promotion_inactive':
      'La promocion seleccionada no se encuentra activa.',
    'inventory.promotion_name_duplicate':
      'Ya existe una promocion con ese nombre.',
    'inventory.branch_promotion_assignment_not_found':
      'El assignment de promocion por sucursal no existe.',
    'inventory.branch_promotion_assignment_duplicate':
      'La promocion ya esta asignada a la sucursal seleccionada.',
    'inventory.promotion_duplicate_items':
      'Los items de la promocion no pueden repetir el mismo producto.',
    'inventory.promotion_items_outside_business':
      'Uno o mas items de la promocion referencian productos fuera de la empresa activa.',
    'inventory.promotion_discount_value_required':
      'Las promociones de descuento requieren discount_value en cada item.',
    'inventory.promotion_override_price_required':
      'Las promociones de precio especial requieren override_price en cada item.',
    'inventory.promotion_buy_x_get_y_fields_required':
      'Las promociones buy x get y requieren min_quantity y bonus_quantity en cada item.',
    'inventory.promotion_date_range_invalid':
      'valid_to no puede ser anterior a valid_from.',
    'inventory.warehouse_not_found': 'La bodega no existe.',
    'inventory.warehouse_name_duplicate':
      'Ya existe una bodega con ese nombre en la sucursal seleccionada.',
    'inventory.warehouse_locations_disabled':
      'La bodega no esta configurada para usar ubicaciones internas.',
    'inventory.warehouse_location_not_found': 'La ubicacion no existe.',
    'inventory.warehouse_location_name_duplicate':
      'Ya existe una ubicacion con ese nombre en la bodega seleccionada.',
    'inventory.warehouse_location_mismatch':
      'La ubicacion no pertenece a la bodega seleccionada.',
    'inventory.warehouse_not_allowed_for_branch':
      'La bodega no esta habilitada para operar desde la sucursal indicada.',
    'inventory.inventory_lot_not_found': 'El lote de inventario no existe.',
    'inventory.inventory_lot_expiration_required':
      'Los productos con vencimiento requieren expiration_date en el lote.',
    'inventory.inventory_lot_number_duplicate':
      'Ya existe un lote con ese numero para el producto en la bodega.',
    'inventory.supplier_contact_not_found':
      'El contacto proveedor no existe en la empresa activa.',
    'inventory.supplier_contact_type_invalid':
      'El contacto seleccionado no esta habilitado como proveedor.',
    'inventory.adjustment_type_invalid':
      'Este endpoint solo permite movimientos adjustment_in y adjustment_out.',
    'inventory.inventory_lot_required':
      'Este producto requiere un lote de inventario para ajustar existencias.',
    'inventory.inventory_lot_warehouse_mismatch':
      'El lote seleccionado no pertenece a la bodega indicada.',
    'inventory.inventory_lot_product_mismatch':
      'El lote seleccionado no pertenece al producto indicado.',
    'inventory.inventory_lot_location_mismatch':
      'El lote seleccionado no pertenece a la ubicacion indicada.',
    'inventory.negative_stock_forbidden':
      'El ajuste produciria inventario negativo y el producto no lo permite.',
    'inventory.insufficient_stock':
      'No hay existencias suficientes para completar la operacion.',
    'inventory.tenant_mismatch':
      'La operacion contiene relaciones que no pertenecen a la empresa activa.',
    'inventory.movement_lines_required':
      'El movimiento requiere al menos una linea.',
    'inventory.movement_quantity_invalid':
      'La cantidad del movimiento debe ser mayor que cero.',
    'inventory.balance_bucket_negative':
      'La operacion produciria un bucket de balance negativo no permitido.',
    'inventory.transfer_line_count_invalid':
      'La transferencia debe contener exactamente dos lineas.',
    'inventory.transfer_line_consistency_invalid':
      'Las lineas de la transferencia no son consistentes entre origen y destino.',
    'inventory.movement_posted_required':
      'Solo los movimientos posteados pueden cancelarse.',
    'inventory.movement_already_cancelled':
      'El movimiento ya fue cancelado previamente.',
    'inventory.movement_relation_missing':
      'El movimiento no tiene cargadas todas las relaciones requeridas.',
    'inventory.inventory_lot_negative_balance_forbidden':
      'El ajuste produciria un saldo negativo en el lote.',
    'inventory.inventory_movement_not_found':
      'El movimiento de inventario no existe.',
    'inventory.product_unit_conversion_not_supported':
      'La conversion de unidades distinta entre venta y stock aun no esta soportada.',
    'inventory.product_variant_delete_forbidden':
      'La variante no puede eliminarse permanentemente porque aun tiene restricciones o dependencias.',
    'sales.order_reservations_already_exist':
      'La orden ya tiene reservas de inventario registradas.',
    'sales.order_line_variant_required':
      'Una linea de la orden no tiene su variante de producto cargada.',
    'sales.order_reservation_required':
      'La orden requiere una reserva activa antes de despacharse.',
    'sales.order_reservation_insufficient':
      'La reserva activa no cubre la cantidad que se intenta despachar.',
    'sales.order_dispatch_requires_confirmation':
      'Solo las ordenes confirmadas pueden programarse para despacho.',
    'sales.order_dispatch_branch_mismatch':
      'La orden de venta pertenece a una sucursal distinta a la del despacho.',
    'rbac.role_not_found': 'El rol no existe.',
    'rbac.role_key_duplicate':
      'Ya existe un rol con esa clave en la empresa activa.',
    'rbac.system_role_delete_forbidden':
      'Los roles de sistema no pueden eliminarse.',
    'rbac.role_in_use_delete_forbidden':
      'No se puede eliminar un rol que ya esta asignado.',
    'rbac.permissions_not_found':
      'Uno o mas permisos no existen en el catalogo global.',
    'platform.missing_authenticated_user':
      'No se pudo resolver el usuario autenticado.',
    'platform.admin_required':
      'Se requieren privilegios de super admin de plataforma.',
    'platform.tenant_context_required':
      'El platform admin debe entrar primero a un contexto de empresa.',
    'platform.business_not_found': 'La empresa seleccionada no existe.',
    'platform.business_inactive':
      'No se puede operar sobre una empresa inactiva.',
    'platform.branch_context_invalid':
      'La sucursal seleccionada no pertenece a la empresa seleccionada.',
    'platform.branch_inactive':
      'No se puede operar sobre una sucursal inactiva.',
    'platform.session_context_unavailable':
      'No se pudo resolver la sesion actual para cambiar de contexto.',
    'platform.context_resolution_failed':
      'No se pudo resolver el contexto operativo del platform admin.',
  },
  en: {
    'errors.internal_server_error': 'An internal error occurred.',
    'errors.bad_request': 'The request is invalid.',
    'errors.unauthorized': 'Unauthorized.',
    'errors.forbidden': 'You do not have permission to perform this action.',
    'errors.not_found': 'The requested resource was not found.',
    'errors.unique_constraint_violation': 'A record with that value already exists in ({{fields}}): ({{values}}).',
    'errors.conflict': 'The operation conflicts with the current state.',
    'validation.error': 'There are validation errors.',
    'validation.required': 'This field is required.',
    'validation.invalid_string': 'This value must be a valid string.',
    'validation.invalid_email': 'The email address is invalid.',
    'validation.min_length':
      'The {{field}} field must have at least {{min}} characters.',
    'validation.max_length':
      'The {{field}} field must not exceed {{max}} characters.',
    'validation.exact_length':
      'The {{field}} field must have exactly {{length}} characters.',
    'validation.invalid_enum': 'The selected value is invalid.',
    'validation.invalid_number': 'The numeric value is invalid.',
    'validation.invalid_boolean': 'The boolean value is invalid.',
    'validation.invalid_date': 'The date value is invalid.',
    'validation.min_value':
      'The {{field}} field must be greater than or equal to {{min}}.',
    'validation.max_value':
      'The {{field}} field must be less than or equal to {{max}}.',
    'validation.positive_number': 'The value must be greater than zero.',
    'validation.array_required': 'A valid list must be provided.',
    'validation.array_unique': 'The list contains duplicated values.',
    'validation.invalid_uuid': 'The identifier is invalid.',
    'validation.pattern_mismatch': 'The value format is invalid.',
    'validation.invalid_nested_object':
      'The nested object structure is invalid.',
    'auth.invalid_credentials': 'The credentials are invalid.',
    'auth.login_forbidden_state':
      'The user cannot log in in the current state.',
    'auth.login_permission_denied':
      'The user does not have permission to log in.',
    'auth.refresh_permission_denied':
      'The user does not have permission to refresh the session.',
    'auth.access_session_not_found':
      'The access session was not found or is unavailable.',
    'auth.access_session_user_mismatch':
      'The access session does not belong to the authenticated user.',
    'auth.access_session_business_mismatch':
      'The access session does not belong to the authenticated business.',
    'auth.access_session_inactive': 'The access session is no longer active.',
    'auth.access_token_payload_invalid':
      'The access token does not contain a valid context.',
    'auth.refresh_session_not_found':
      'The refresh session was not found or is unavailable.',
    'auth.refresh_session_user_mismatch':
      'The refresh session does not belong to the authenticated user.',
    'auth.refresh_session_business_mismatch':
      'The refresh session does not belong to the authenticated business.',
    'auth.refresh_session_inactive': 'The refresh session is no longer active.',
    'auth.refresh_session_revoked':
      'The refresh session has already been revoked.',
    'auth.refresh_session_expired': 'The refresh session has expired.',
    'auth.refresh_token_mismatch':
      'The refresh token does not match the persisted session.',
    'auth.refresh_token_payload_invalid':
      'The refresh token does not contain a valid context.',
    'auth.context_resolution_failed':
      'The authenticated user context could not be resolved.',
    'common.entity_code_invalid_format':
      'The code does not match the expected format for prefix {{prefix}}.',
    'common.entity_code_assignment_conflict':
      'A unique code could not be assigned for prefix {{prefix}}.',
    'common.field_encryption_key_missing':
      'Field encryption configuration is unavailable.',
    'common.encrypted_payload_invalid_format':
      'The encrypted value does not have a valid format.',
    'common.idempotency_key_in_progress':
      'A request with the same idempotency key is already being processed.',
    'common.idempotency_key_payload_mismatch':
      'The idempotency key was already used with a different payload.',
    'businesses.not_found': 'The business does not exist.',
    'businesses.identification_duplicate':
      'The business identification already exists.',
    'businesses.owner_email_duplicate':
      'The owner email already exists in the system.',
    'businesses.owner_role_resolution_failed':
      'The owner role could not be resolved for the new business.',
    'users.not_found': 'The user does not exist.',
    'users.email_duplicate': 'The email address already exists.',
    'users.invalid_roles_for_business':
      'One or more roles do not belong to the active business.',
    'users.invalid_branches_for_business':
      'One or more branches do not belong to the active business.',
    'users.system_user_api_forbidden':
      'System users cannot be managed through this operation.',
    'users.owner_assignment_forbidden':
      'Only an owner can create or update owner users.',
    'users.cross_business_management_forbidden':
      'Cross-business user management is not allowed.',
    'users.owner_management_forbidden':
      'Only an owner can manage another owner.',
    'users.system_management_forbidden':
      'System users cannot be managed from this context.',
    'users.self_delete_forbidden': 'A user cannot delete itself.',
    'users.platform_admin_delete_forbidden':
      'Platform admin users cannot be deleted from this context.',
    'users.last_owner_delete_forbidden':
      'The last owner user of the business cannot be deleted.',
    'users.delete_forbidden':
      'The user cannot be deleted because it has associated operational history.',
    'contacts.not_found': 'The contact does not exist.',
    'contacts.code_duplicate': 'The contact code already exists.',
    'contacts.identification_duplicate':
      'The identification already exists in this business.',
    'contacts.lookup_multiple':
      'More than one contact matches that identification in this business.',
    'contacts.delete_forbidden':
      'The contact cannot be deleted because it has associated operational history.',
    'contacts.branch_assignment_not_found':
      'The contact branch assignment does not exist.',
    'contacts.branch_assignment_duplicate':
      'This contact already has an assignment for the selected branch.',
    'contacts.branch_exclusive_conflict':
      'The contact already has an active exclusive assignment in another branch.',
    'contacts.account_manager_branch_scope_invalid':
      'The assigned account manager does not have access to the selected branch.',
    'branches.not_found': 'The branch does not exist.',
    'branches.access_forbidden':
      'The user does not have access to this branch.',
    'branches.manage_scope_forbidden':
      'The user cannot operate on one or more selected branches.',
    'branches.configuration_permission_required':
      'branches.configure is required to edit sensitive configuration.',
    'branches.delete_forbidden':
      'The branch cannot be deleted because it has associated operational dependencies.',
    'terminals.not_found': 'The terminal does not exist.',
    'inventory.category_not_found': 'The category does not exist.',
    'inventory.category_name_duplicate':
      'A category with that name already exists at the same hierarchy level.',
    'inventory.category_parent_self_invalid':
      'A category cannot be assigned as its own parent.',
    'inventory.category_parent_descendant_invalid':
      'A category cannot be moved under one of its descendants.',
    'inventory.brand_not_found': 'The brand does not exist.',
    'inventory.brand_name_duplicate': 'A brand with that name already exists.',
    'inventory.measurement_unit_not_found':
      'The measurement unit does not exist.',
    'inventory.measurement_unit_name_or_symbol_duplicate':
      'A measurement unit with that name or symbol already exists.',
    'inventory.tax_profile_not_found': 'The tax profile does not exist.',
    'inventory.tax_profile_name_duplicate':
      'A tax profile with that name already exists.',
    'inventory.tax_profile_iva_rate_required':
      'IVA tax profiles require an iva_rate value.',
    'inventory.tax_profile_specific_fields_required':
      'Specific tax profiles require specific_tax_name and specific_tax_rate.',
    'inventory.warranty_profile_not_found':
      'The warranty profile does not exist.',
    'inventory.warranty_profile_name_duplicate':
      'A warranty profile with that name already exists.',
    'inventory.product_not_found': 'The product does not exist.',
    'inventory.product_sku_duplicate':
      'A product with that SKU already exists.',
    'inventory.product_barcode_duplicate':
      'A product with that barcode already exists.',
    'inventory.product_tax_profile_goods_required':
      'Goods products require a goods tax profile.',
    'inventory.product_tax_profile_service_required':
      'Service items require a service tax profile.',
    'inventory.product_inventory_tracking_required':
      'This product does not support inventory tracking.',
    'inventory.product_lot_tracking_requires_inventory':
      'Products with lot tracking must also track inventory.',
    'inventory.product_expiration_requires_lots':
      'Products with expiration tracking must also track lots.',
    'inventory.product_warranty_profile_required':
      'Products with warranty enabled require a warranty profile.',
    'inventory.product_lot_tracking_required':
      'This product does not support lot-based inventory.',
    'inventory.price_list_not_found': 'The price list does not exist.',
    'inventory.price_list_inactive': 'The selected price list is not active.',
    'inventory.price_list_name_duplicate':
      'A price list with that name already exists.',
    'inventory.branch_price_list_assignment_not_found':
      'The branch price list assignment does not exist.',
    'inventory.branch_price_list_assignment_duplicate':
      'The price list is already assigned to the selected branch.',
    'inventory.branch_price_list_default_requires_active_assignment':
      'Only an active assignment can be marked as the default for the branch.',
    'inventory.product_price_not_found': 'The product price does not exist.',
    'inventory.price_valid_range_invalid':
      'valid_to cannot be earlier than valid_from.',
    'inventory.promotion_not_found': 'The promotion does not exist.',
    'inventory.promotion_inactive': 'The selected promotion is not active.',
    'inventory.promotion_name_duplicate':
      'A promotion with that name already exists.',
    'inventory.branch_promotion_assignment_not_found':
      'The branch promotion assignment does not exist.',
    'inventory.branch_promotion_assignment_duplicate':
      'The promotion is already assigned to the selected branch.',
    'inventory.promotion_duplicate_items':
      'Promotion items cannot repeat the same product.',
    'inventory.promotion_items_outside_business':
      'One or more promotion items reference products outside the active business.',
    'inventory.promotion_discount_value_required':
      'Discount promotions require discount_value on each item.',
    'inventory.promotion_override_price_required':
      'Price override promotions require override_price on each item.',
    'inventory.promotion_buy_x_get_y_fields_required':
      'Buy X get Y promotions require min_quantity and bonus_quantity on each item.',
    'inventory.promotion_date_range_invalid':
      'valid_to cannot be earlier than valid_from.',
    'inventory.warehouse_not_found': 'The warehouse does not exist.',
    'inventory.warehouse_name_duplicate':
      'A warehouse with that name already exists in the selected branch.',
    'inventory.warehouse_locations_disabled':
      'This warehouse is not configured to use internal locations.',
    'inventory.warehouse_location_not_found':
      'The warehouse location does not exist.',
    'inventory.warehouse_location_name_duplicate':
      'A location with that name already exists in the selected warehouse.',
    'inventory.warehouse_location_mismatch':
      'The warehouse location does not belong to the selected warehouse.',
    'inventory.warehouse_not_allowed_for_branch':
      'The warehouse is not enabled for the selected branch.',
    'inventory.inventory_lot_not_found': 'The inventory lot does not exist.',
    'inventory.inventory_lot_expiration_required':
      'Products with expiration tracking require expiration_date on the lot.',
    'inventory.inventory_lot_number_duplicate':
      'A lot with that number already exists for the product in the warehouse.',
    'inventory.supplier_contact_not_found':
      'The supplier contact does not exist in the active business.',
    'inventory.supplier_contact_type_invalid':
      'The selected contact is not enabled as a supplier.',
    'inventory.adjustment_type_invalid':
      'This endpoint only supports adjustment_in and adjustment_out movements.',
    'inventory.inventory_lot_required':
      'This product requires an inventory lot for stock adjustments.',
    'inventory.inventory_lot_warehouse_mismatch':
      'The selected inventory lot does not belong to the warehouse.',
    'inventory.inventory_lot_product_mismatch':
      'The selected inventory lot does not belong to the product.',
    'inventory.inventory_lot_location_mismatch':
      'The selected inventory lot does not belong to the warehouse location.',
    'inventory.negative_stock_forbidden':
      'This adjustment would produce negative stock and the product does not allow it.',
    'inventory.insufficient_stock':
      'There is not enough stock to complete the operation.',
    'inventory.tenant_mismatch':
      'The operation contains relations outside the active business.',
    'inventory.movement_lines_required':
      'The movement requires at least one line.',
    'inventory.movement_quantity_invalid':
      'The movement quantity must be greater than zero.',
    'inventory.balance_bucket_negative':
      'The operation would produce a disallowed negative balance bucket.',
    'inventory.transfer_line_count_invalid':
      'The transfer must contain exactly two lines.',
    'inventory.transfer_line_consistency_invalid':
      'The transfer lines are inconsistent between origin and destination.',
    'inventory.movement_posted_required':
      'Only posted movements can be cancelled.',
    'inventory.movement_already_cancelled':
      'The movement has already been cancelled.',
    'inventory.movement_relation_missing':
      'The movement is missing one or more required loaded relations.',
    'inventory.inventory_lot_negative_balance_forbidden':
      'This adjustment would produce a negative lot balance.',
    'inventory.inventory_movement_not_found':
      'The inventory movement does not exist.',
    'inventory.product_unit_conversion_not_supported':
      'Different sale and stock unit conversion is not supported yet.',
    'inventory.product_variant_delete_forbidden':
      'The variant cannot be permanently deleted because it still has restrictions or dependencies.',
    'sales.order_reservations_already_exist':
      'The sale order already has inventory reservations registered.',
    'sales.order_line_variant_required':
      'A sale order line is missing its loaded product variant.',
    'sales.order_reservation_required':
      'The sale order requires an active reservation before it can be dispatched.',
    'sales.order_reservation_insufficient':
      'The active reservation does not cover the quantity being dispatched.',
    'sales.order_dispatch_requires_confirmation':
      'Only confirmed sale orders can be scheduled for dispatch.',
    'sales.order_dispatch_branch_mismatch':
      'The sale order belongs to a different branch than the dispatch order.',
    'rbac.role_not_found': 'The role does not exist.',
    'rbac.role_key_duplicate':
      'A role with that business key already exists in the active business.',
    'rbac.system_role_delete_forbidden': 'System roles cannot be deleted.',
    'rbac.role_in_use_delete_forbidden':
      'A role assigned to users cannot be deleted.',
    'rbac.permissions_not_found':
      'One or more permissions do not exist in the global catalog.',
    'platform.missing_authenticated_user':
      'The authenticated user context could not be resolved.',
    'platform.admin_required': 'Platform super admin privileges are required.',
    'platform.tenant_context_required':
      'The platform admin must enter a business context first.',
    'platform.business_not_found': 'The selected business does not exist.',
    'platform.business_inactive':
      'Inactive businesses cannot be used for operational context.',
    'platform.branch_context_invalid':
      'The selected branch does not belong to the selected business.',
    'platform.branch_inactive':
      'Inactive branches cannot be used for operational context.',
    'platform.session_context_unavailable':
      'The current session could not be resolved for context switching.',
    'platform.context_resolution_failed':
      'The platform admin operational context could not be resolved.',
  },
} as const;

export type SupportedErrorLanguage = keyof typeof error_translations;
