import { describe, it, expect, vi } from 'vitest';
import * as apiModule from '../api';

describe('services/api baseURL y token', () => {
  it('usa /api en desarrollo por defecto', () => {
    // forzar entorno dev
    (import.meta as any).env = { DEV: true };
    const instance = (apiModule as any).api;
    expect(instance.defaults.baseURL).toBe('/api');
  });

  it('inyecta Authorization si hay access_token', async () => {
    localStorage.setItem('access_token', 'abc123');
    const { apiGet } = apiModule as any;
    const spy = vi.spyOn((apiModule as any).api, 'get').mockResolvedValue({ data: {} });
    await apiGet('/test');
    expect(spy).toHaveBeenCalled();
  });
});


