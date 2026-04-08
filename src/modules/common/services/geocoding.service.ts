import { Injectable, Logger } from '@nestjs/common';

interface GeocodingParams {
  address?: string | null;
  district?: string | null;
  canton?: string | null;
  province?: string | null;
}

interface GeocodingResult {
  latitude: number;
  longitude: number;
}

interface NominatimResponse {
  lat: string;
  lon: string;
}

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);
  private readonly cache = new Map<string, GeocodingResult | null>();
  private last_request_time = 0;

  async geocode(params: GeocodingParams): Promise<GeocodingResult | null> {
    try {
      const query = this.build_query(params);
      if (!query) {
        return null;
      }

      const cached = this.cache.get(query);
      if (cached !== undefined) {
        return cached;
      }

      await this.throttle();

      const url = new URL('https://nominatim.openstreetmap.org/search');
      url.searchParams.set('q', query);
      url.searchParams.set('format', 'json');
      url.searchParams.set('limit', '1');
      url.searchParams.set('countrycodes', 'cr');

      const response = await fetch(url.toString(), {
        headers: {
          'User-Agent': 'FACFAST/1.0',
        },
      });

      if (!response.ok) {
        this.logger.warn(
          `Nominatim returned HTTP ${response.status} for query: ${query}`,
        );
        this.cache.set(query, null);
        return null;
      }

      const data = (await response.json()) as NominatimResponse[];

      if (!data.length) {
        this.cache.set(query, null);
        return null;
      }

      const result: GeocodingResult = {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
      };

      if (isNaN(result.latitude) || isNaN(result.longitude)) {
        this.cache.set(query, null);
        return null;
      }

      this.cache.set(query, result);
      return result;
    } catch (error) {
      this.logger.warn(
        `Geocoding failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  private build_query(params: GeocodingParams): string | null {
    const parts = [params.address, params.district, params.canton, params.province]
      .filter((part): part is string => !!part);

    if (parts.length === 0) {
      return null;
    }

    return parts.join(', ') + ', Costa Rica';
  }

  private async throttle(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.last_request_time;
    const min_interval = 1000;

    if (elapsed < min_interval) {
      await new Promise((resolve) => setTimeout(resolve, min_interval - elapsed));
    }

    this.last_request_time = Date.now();
  }
}
