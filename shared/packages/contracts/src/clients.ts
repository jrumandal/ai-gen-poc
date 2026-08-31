/**
 * Typed REST clients for the catalog, cart, and user services.
 *
 * A self-contained, dependency-free implementation (plain `fetch`) that mirrors
 * the shape of the reference `createContractClients` (one client per service).
 * Each client exposes `get` / `post` / `put` / `delete` helpers that return
 * typed JSON, so MFs can call the REST APIs without a codegen pipeline.
 */

export interface ContractClient {
  get<T>(path: string, init?: RequestInit): Promise<T>;
  post<T>(path: string, body?: unknown, init?: RequestInit): Promise<T>;
  put<T>(path: string, body?: unknown, init?: RequestInit): Promise<T>;
  delete<T>(path: string, init?: RequestInit): Promise<T>;
}

export type ContractClients = {
  catalog: ContractClient;
  cart: ContractClient;
  user: ContractClient;
};

function createClient(baseUrl: string): ContractClient {
  const request = async <T>(method: string, path: string, body?: unknown, init?: RequestInit): Promise<T> => {
    const res = await fetch(`${baseUrl}${path}`, {
      ...init,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(init?.headers ?? {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status} ${res.statusText} — ${text}`);
    }
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  };

  return {
    get: (path, init) => request('GET', path, undefined, init),
    post: (path, body, init) => request('POST', path, body, init),
    put: (path, body, init) => request('PUT', path, body, init),
    delete: (path, init) => request('DELETE', path, undefined, init),
  };
}

export function createContractClients(baseUrls: {
  catalog: string;
  cart: string;
  user: string;
}): ContractClients {
  return {
    catalog: createClient(baseUrls.catalog),
    cart: createClient(baseUrls.cart),
    user: createClient(baseUrls.user),
  };
}
