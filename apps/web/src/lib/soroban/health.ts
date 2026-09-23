import { sorobanRpc } from './client';

export type RpcHealthStatus = 'healthy' | 'degraded' | 'unreachable';

export interface RpcHealthInfo {
  status: RpcHealthStatus;
  label: string;
}

export async function getRpcHealth(): Promise<RpcHealthInfo> {
  try {
    const res = await Promise.race([
      sorobanRpc.getHealth(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
    ]);

    // The RPC SDK types `status` as the literal "healthy", but the server can
    // in practice return other values — widen before comparing.
    const status: string = res.status
    if (status === 'healthy') {
      return { status: 'healthy', label: 'Connected' };
    }
    return { status: 'degraded', label: 'Degraded' };
  } catch (error) {
    return { status: 'unreachable', label: 'Unreachable' };
  }
}
