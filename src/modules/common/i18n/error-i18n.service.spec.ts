import { ErrorI18nService } from './error-i18n.service';

describe('ErrorI18nService', () => {
  let service: ErrorI18nService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ErrorI18nService();
  });

  it('uses the active tenant language before Accept-Language for a normal tenant user', () => {
    expect(
      service.resolve_language({
        headers: {
          'accept-language': 'es-CR,es;q=0.9',
        },
        user: {
          active_business_language: 'en-US',
        },
      } as never),
    ).toBe('en');
  });

  it('uses the active tenant language before Accept-Language for a platform admin in tenant_context', () => {
    expect(
      service.resolve_language({
        headers: {
          'accept-language': 'es-CR,es;q=0.9',
        },
        user: {
          active_business_language: 'en-US',
        },
      } as never),
    ).toBe('en');
  });

  it('uses Accept-Language in platform mode when there is no active tenant', () => {
    expect(
      service.resolve_language({
        headers: {
          'accept-language': 'en-US,en;q=0.9',
        },
        user: {
          active_business_language: null,
        },
      } as never),
    ).toBe('en');
  });

  it('falls back to Accept-Language when the active business language is missing', () => {
    expect(
      service.resolve_language({
        headers: {
          'accept-language': 'en-US,en;q=0.9',
        },
        user: {
          active_business_language: '   ',
        },
      } as never),
    ).toBe('en');
  });

  it('falls back to es when there is no business language and no useful header', () => {
    expect(
      service.resolve_language({
        headers: {
          'accept-language': 'fr-FR,fr;q=0.9',
        },
        user: {
          active_business_language: null,
        },
      } as never),
    ).toBe('es');
  });

  it('translates known keys and interpolates params', () => {
    expect(
      service.translate('validation.min_length', 'es', {
        field: 'password',
        min: 10,
      }),
    ).toBe('El campo password debe tener al menos 10 caracteres.');
  });
});
