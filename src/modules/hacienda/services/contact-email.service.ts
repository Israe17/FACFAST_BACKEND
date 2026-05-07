import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ContactEmailService {
  private readonly logger = new Logger(ContactEmailService.name);
  private readonly cache = new Map<string, string | null>();
  private last_request_time = 0;

  async lookup(identification: string | undefined): Promise<string | null> {
    try {
      const trimmed = identification?.trim() ?? '';
      if (trimmed.length === 0) {
        return null;
      }

      const cached = this.cache.get(trimmed);
      if (cached !== undefined) {
        return cached;
      }

      await this.throttle();

      const url = new URL('https://api.hacienda.go.cr/fe/mifacturacorreo');
      url.searchParams.set('identificacion', trimmed);

      const response = await fetch(url.toString(), {
        headers: { 'User-Agent': 'FACFAST/1.0' },
      });

      if (response.status === 404) {
        this.cache.set(trimmed, null);
        return null;
      }

      if (!response.ok) {
        this.logger.warn(
          `Hacienda mifacturacorreo API returned HTTP ${response.status} for: ${trimmed}`,
        );
        return null;
      }

      const data = (await response.json()) as Record<string, unknown>;
      const email = this.extract_email(data);

      if (!email) {
        this.cache.set(trimmed, null);
        return null;
      }

      this.cache.set(trimmed, email);
      return email;
    } catch (error) {
      this.logger.warn(
        `Contact email lookup failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  private extract_email(data: Record<string, unknown>): string | null {
    const candidates: unknown[] = [
      (data.Resultado as Record<string, unknown> | undefined)?.Correo,
      (data.resultado as Record<string, unknown> | undefined)?.correo,
      data.Correo,
      data.correo,
      data.email,
    ];

    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim().length > 0) {
        return candidate.trim();
      }
    }
    return null;
  }

  private async throttle(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.last_request_time;
    const min_interval = 200;

    if (elapsed < min_interval) {
      await new Promise((resolve) =>
        setTimeout(resolve, min_interval - elapsed),
      );
    }

    this.last_request_time = Date.now();
  }
}
