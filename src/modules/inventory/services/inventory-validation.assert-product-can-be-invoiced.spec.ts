import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { Product } from '../entities/product.entity';
import { InventoryValidationService } from './inventory-validation.service';

function build_product(overrides: Partial<Product> = {}): Product {
  return {
    id: 1,
    business_id: 1,
    name: 'Producto X',
    tax_profile_id: 5,
    ...overrides,
  } as Product;
}

describe('InventoryValidationService.assert_product_can_be_invoiced', () => {
  let service: InventoryValidationService;

  beforeEach(() => {
    // The method is a pure check on Product, so we don't need repository
    // mocks. We instantiate with empty stubs typed as never.
    service = new InventoryValidationService(
      ...([
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
      ] as unknown as ConstructorParameters<typeof InventoryValidationService>),
    );
  });

  it('rejects product with null tax_profile_id', () => {
    const product = build_product({ tax_profile_id: null });
    expect(() => service.assert_product_can_be_invoiced(product)).toThrow(
      DomainBadRequestException,
    );
  });

  it('accepts product with a tax_profile_id', () => {
    const product = build_product({ tax_profile_id: 5 });
    expect(() =>
      service.assert_product_can_be_invoiced(product),
    ).not.toThrow();
  });

  it('exception payload includes product identity for messaging', () => {
    const product = build_product({
      id: 7,
      name: 'Producto sin perfil',
      tax_profile_id: null,
    });
    try {
      service.assert_product_can_be_invoiced(product);
      fail('expected to throw');
    } catch (error) {
      const response = (error as DomainBadRequestException).getResponse() as {
        code: string;
        messageKey: string;
        details: Record<string, unknown>;
      };
      expect(response.code).toBe('PRODUCT_FISCAL_DATA_REQUIRED');
      expect(response.messageKey).toBe(
        'inventory.product_fiscal_data_required',
      );
      expect(response.details).toEqual({
        product_id: 7,
        product_name: 'Producto sin perfil',
      });
    }
  });
});
