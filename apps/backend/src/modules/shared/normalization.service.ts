import { Injectable } from '@nestjs/common';

@Injectable()
export class NormalizationService {
  normalizeEmail(value?: string | null): string | null {
    const normalized = (value ?? '').trim().toLowerCase();
    return normalized || null;
  }

  normalizePhone(value?: string | null): string | null {
    const raw = (value ?? '').trim();

    if (!raw) {
      return null;
    }

    const hasLeadingPlus = raw.startsWith('+');
    const digits = raw.replace(/\D/g, '');

    if (!digits) {
      return null;
    }

    return `${hasLeadingPlus ? '+' : ''}${digits}`;
  }

  normalizeRegistration(value: string): string {
    return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  }

  normalizeVin(value?: string | null): string | null {
    const normalized = (value ?? '')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');

    return normalized || null;
  }
}
