import { Injectable, Logger } from '@nestjs/common';

export interface ExonerationResult {
  numeroDocumento: string;
  identificacion: string;
  porcentajeExoneracion: number;
  fechaEmision: string;
  fechaVencimiento: string;
  tipoDocumento: { codigo: string; descripcion: string };
  nombreInstitucion: string;
  cabys: string[];
  poseeCabys: boolean;
}

@Injectable()
export class ExonerationService {
  private readonly logger = new Logger(ExonerationService.name);
  private readonly cache = new Map<string, ExonerationResult | null>();
  private last_request_time = 0;

  async verify(
    authorization: string | undefined,
  ): Promise<ExonerationResult | null> {
    try {
      const trimmed = authorization?.trim() ?? '';
      if (trimmed.length === 0) {
        return null;
      }

      const cached = this.cache.get(trimmed);
      if (cached !== undefined) {
        return cached;
      }

      await this.throttle();

      const url = new URL('https://api.hacienda.go.cr/fe/ex');
      url.searchParams.set('autorizacion', trimmed);

      const response = await fetch(url.toString(), {
        headers: { 'User-Agent': 'FACFAST/1.0' },
      });

      if (response.status === 404) {
        this.cache.set(trimmed, null);
        return null;
      }

      if (!response.ok) {
        this.logger.warn(
          `Hacienda EX API returned HTTP ${response.status} for: ${trimmed}`,
        );
        return null;
      }

      const data = (await response.json()) as ExonerationResult;

      if (!data.numeroDocumento) {
        this.cache.set(trimmed, null);
        return null;
      }

      const result: ExonerationResult = {
        numeroDocumento: data.numeroDocumento,
        identificacion: data.identificacion,
        porcentajeExoneracion: data.porcentajeExoneracion,
        fechaEmision: data.fechaEmision,
        fechaVencimiento: data.fechaVencimiento,
        tipoDocumento: data.tipoDocumento,
        nombreInstitucion: data.nombreInstitucion,
        cabys: Array.isArray(data.cabys) ? data.cabys : [],
        poseeCabys: data.poseeCabys ?? false,
      };

      this.cache.set(trimmed, result);
      return result;
    } catch (error) {
      this.logger.warn(
        `Exoneration verify failed: ${error instanceof Error ? error.message : String(error)}`,
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
