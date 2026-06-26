import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class CameraService {
  private readonly logger = new Logger(CameraService.name);
  private readonly ocrServiceUrl: string;
  private readonly timeoutMs: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.ocrServiceUrl = this.configService.get<string>('OCR_SERVICE_URL') ?? 'http://localhost:8000';
    this.timeoutMs = Number(this.configService.get<string>('OCR_SERVICE_TIMEOUT_MS') ?? 30_000);
  }

  async capturePlate() {
    const url = `${this.ocrServiceUrl.replace(/\/$/, '')}/capture-plate`;

    try {
      const { data } = await firstValueFrom(
        this.httpService.post(url, {}, {
          timeout: this.timeoutMs,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      if (data.success) {
        this.logger.log(
          `Plate captured: ${data.plate} (candidates: ${data.candidates.join(', ')})`,
        );
      } else {
        this.logger.warn(`Plate capture failed: ${data.message}`);
      }

      return data;
    } catch (error) {
      const message = this.resolveErrorMessage(error);
      this.logger.error(`OCR service request failed: ${message}`);
      throw new ServiceUnavailableException(
        `OCR service unavailable: ${message}`,
      );
    }
  }

  async capturePlateOrThrow() {
    const result = await this.capturePlate();

    if (!result.success) {
      throw new ServiceUnavailableException(
        result.message ?? 'Plate not found',
      );
    }

    return result;
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof AxiosError) {
      if (error.code === 'ECONNREFUSED') {
        return 'Connection refused — is the Python OCR service running?';
      }
      if (error.response?.data && typeof error.response.data === 'object') {
        const body = error.response.data as { message?: string };
        if (body.message) {
          return body.message;
        }
      }
      return error.message;
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'Unknown error';
  }
}
