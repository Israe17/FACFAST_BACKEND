import { Injectable, Logger } from '@nestjs/common';

export interface TaxpayerActivity {
  estado: string;
  tipo: string;
  codigo: string;
  descripcion: string;
}

export interface TaxpayerResult {
  nombre: string;
  tipoIdentificacion: string;
  regimen: { codigo: number; descripcion: string };
  situacion: {
    moroso: string;
    omiso: string;
    estado: string;
    administracionTributaria: string;
  };
  actividades: TaxpayerActivity[];
}

@Injectable()
export class TaxpayerService {
  private readonly logger = new Logger(TaxpayerService.name);
  private readonly cache = new Map<string, TaxpayerResult | null>();
  private last_request_time = 0;

  async lookup(identification: string | undefined): Promise<TaxpayerResult | null> {
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

      const url = new URL('https://api.hacienda.go.cr/fe/ae');
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
          `Hacienda AE API returned HTTP ${response.status} for: ${trimmed}`,
        );
        return null;
      }

      const data = (await response.json()) as TaxpayerResult;

      if (!data.nombre) {
        this.cache.set(trimmed, null);
        return null;
      }

      const result: TaxpayerResult = {
        nombre: data.nombre,
        tipoIdentificacion: data.tipoIdentificacion,
        regimen: data.regimen,
        situacion: data.situacion,
        actividades: Array.isArray(data.actividades) ? data.actividades : [],
      };

      this.cache.set(trimmed, result);
      return result;
    } catch (error) {
      this.logger.warn(
        `Taxpayer lookup failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
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
