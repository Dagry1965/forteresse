type ListEnvelope<T> = {
  data?: T[];
  items?: T[];
};

export function normalizeList<T>(res: T[]): T[];
export function normalizeList<T>(res: ListEnvelope<T>): T[];
export function normalizeList(res: unknown): unknown[];
export function normalizeList(res: unknown): unknown[] {
  if (Array.isArray(res)) return res;

  if (res && typeof res === 'object') {
    const envelope = res as ListEnvelope<unknown>;

    if (Array.isArray(envelope.data)) return envelope.data;
    if (Array.isArray(envelope.items)) return envelope.items;
  }

  return [];
}
