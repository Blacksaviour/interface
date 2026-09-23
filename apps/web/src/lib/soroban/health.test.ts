import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { HttpResponse, http } from 'msw';
import { getRpcHealth } from './health';

const rpcUrl = import.meta.env.VITE_RPC_URL || 'http://localhost:8000';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  vi.useRealTimers();
});
afterAll(() => server.close());

describe('RPC health detection', () => {
  it('maps healthy status to Connected', async () => {
    server.use(
      http.post(rpcUrl, () => {
        // Stellar RPC getHealth returns JSON-RPC response
        return HttpResponse.json({
          jsonrpc: '2.0',
          id: 1,
          result: { status: 'healthy' }
        });
      })
    );

    const result = await getRpcHealth();
    expect(result.status).toBe('healthy');
    expect(result.label).toBe('Connected');
  });

  it('maps degraded status to Degraded', async () => {
    server.use(
      http.post(rpcUrl, () => {
        return HttpResponse.json({
          jsonrpc: '2.0',
          id: 1,
          result: { status: 'degraded' } // Or whatever degraded means in RPC, often just not 'healthy' or has different fields
        });
      })
    );

    const result = await getRpcHealth();
    expect(result.status).toBe('degraded');
    expect(result.label).toBe('Degraded');
  });

  it('maps unreachable status to Unreachable on network error', async () => {
    server.use(
      http.post(rpcUrl, () => {
        return HttpResponse.error();
      })
    );

    const result = await getRpcHealth();
    expect(result.status).toBe('unreachable');
    expect(result.label).toBe('Unreachable');
  });

  it('handles timeout correctly', async () => {
    vi.useFakeTimers();
    server.use(
      http.post(rpcUrl, async () => {
        // Delay response to simulate timeout
        return new Promise(() => {}); // never resolves
      })
    );
    
    // getRpcHealth itself should handle timeout or the underlying sorobanRpc does.
    // If we want to test timeout handling with fake timers, we run it and advance timers.
    const promise = getRpcHealth();
    vi.runAllTimers();
    const result = await promise;
    expect(result.status).toBe('unreachable');
    expect(result.label).toBe('Unreachable');
  });
});
