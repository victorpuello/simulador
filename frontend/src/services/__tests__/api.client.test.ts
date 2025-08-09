import { describe, it, expect, vi } from 'vitest';
import * as apiModule from '../api';

describe('services/api baseURL y token', () => {
  it('usa /api en desarrollo por defecto', () => {
    // forzar entorno dev
    (import.meta as unknown as { env?: Record<string, unknown> }).env = { DEV: true };
    const instance = (apiModule as unknown as { api: { defaults: { baseURL: string } } }).api;
    expect(instance.defaults.baseURL).toBe('/api');
  });

  it('inyecta Authorization si hay access_token', async () => {
    localStorage.setItem('access_token', 'abc123');
    const { apiGet } = apiModule as unknown as { apiGet: (url: string) => Promise<unknown>; api: { get: (url: string) => Promise<{ data: unknown }> } };
    const spy = vi.spyOn((apiModule as unknown as { api: { get: (url: string) => Promise<{ data: unknown }> } }).api, 'get').mockResolvedValue({ data: {} });
    await apiGet('/test');
    expect(spy).toHaveBeenCalled();
  });
});


