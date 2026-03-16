import { Injectable } from '@nestjs/common';
import { RequestWithContext } from '../interfaces/request-context.interface';
import {
  error_translations,
  SupportedErrorLanguage,
} from './error-translations';

@Injectable()
export class ErrorI18nService {
  resolve_language(request: RequestWithContext): SupportedErrorLanguage {
    const business_language = this.normalize_language(
      request.user?.active_business_language,
    );
    if (business_language) {
      return business_language;
    }

    const header_language = this.parse_accept_language(
      request.headers['accept-language'],
    );
    if (header_language) {
      return header_language;
    }

    return 'es';
  }

  translate(
    message_key: string,
    language: SupportedErrorLanguage,
    params?: Record<string, string | number | boolean | null | undefined>,
  ): string {
    const fallback_messages = error_translations.es as Record<string, string>;
    const messages = error_translations[language] as Record<string, string>;
    const template =
      messages[message_key] ?? fallback_messages[message_key] ?? message_key;

    return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
      const value = params?.[key];
      return value === undefined || value === null ? '' : String(value);
    });
  }

  private parse_accept_language(
    header_value: string | string[] | undefined,
  ): SupportedErrorLanguage | null {
    const raw_value = Array.isArray(header_value)
      ? header_value.join(',')
      : header_value;

    if (!raw_value) {
      return null;
    }

    const normalized_tokens = raw_value
      .split(',')
      .map((token) => token.trim().split(';')[0]?.toLowerCase())
      .filter(Boolean);

    for (const token of normalized_tokens) {
      const normalized = this.normalize_language(token);
      if (normalized) {
        return normalized;
      }
    }

    return null;
  }

  private normalize_language(
    language: string | null | undefined,
  ): SupportedErrorLanguage | null {
    if (!language) {
      return null;
    }

    const normalized = language.trim().toLowerCase();
    if (normalized.startsWith('en')) {
      return 'en';
    }
    if (normalized.startsWith('es')) {
      return 'es';
    }

    return null;
  }
}
