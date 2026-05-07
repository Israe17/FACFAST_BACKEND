import { Injectable, Logger } from '@nestjs/common';

interface CabysResult {
  codigo: string;
  descripcion: string;
  impuesto: number;
}

interface HaciendaSearchResponse {
  total: number;
  cantidad: number;
  cabys: Array<{
    codigo: string;
    descripcion: string;
    impuesto: number;
  }>;
}

@Injectable()
export class CabysService {
  private readonly logger = new Logger(CabysService.name);
  private readonly cache = new Map<string, CabysResult[]>();
  private last_request_time = 0;

  async search(query: string, top: number): Promise<CabysResult[]> {
    try {
      const trimmed = query.trim();
      if (trimmed.length < 3) {
        return [];
      }

      const cache_key = `${trimmed}:${top}`;
      const cached = this.cache.get(cache_key);
      if (cached !== undefined) {
        return cached;
      }

      await this.throttle();

      const url = new URL('https://api.hacienda.go.cr/fe/cabys');
      url.searchParams.set('q', trimmed);
      url.searchParams.set('top', String(top));

      const response = await fetch(url.toString(), {
        headers: {
          'User-Agent': 'FACFAST/1.0',
        },
      });

      if (!response.ok) {
        this.logger.warn(
          `Hacienda CABYS API returned HTTP ${response.status} for query: ${trimmed}`,
        );
        this.cache.set(cache_key, []);
        return [];
      }

      const data = (await response.json()) as HaciendaSearchResponse;

      if (!data.cabys || !Array.isArray(data.cabys)) {
        this.cache.set(cache_key, []);
        return [];
      }

      const results: CabysResult[] = data.cabys.map((item) => ({
        codigo: item.codigo,
        descripcion: item.descripcion,
        impuesto: item.impuesto,
      }));

      this.cache.set(cache_key, results);
      return results;
    } catch (error) {
      this.logger.warn(
        `CABYS search failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return [];
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
