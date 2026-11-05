export interface Capability {
  readonly key: string;
  readonly url: string;
  readonly method: string;
  readonly auth?: boolean;
}
export type CapabilityMap = Readonly<Record<string, Capability>>;
export type Params = Record<string, unknown>;
export interface RequestOptions {
  headers?: HeadersInit;
  signal?: AbortSignal;
  responseType?: 'auto' | 'json' | 'text' | 'blob' | 'arrayBuffer' | 'response';
}
export interface ApiClient {
  call(name: string, params: Params | undefined, body: unknown, options: RequestOptions & {responseType: 'response'}): Promise<Response>;
  call(name: string, params: Params | undefined, body: unknown, options: RequestOptions & {responseType: 'blob'}): Promise<Blob | null>;
  call(name: string, params: Params | undefined, body: unknown, options: RequestOptions & {responseType: 'arrayBuffer'}): Promise<ArrayBuffer | null>;
  call(name: string, params: Params | undefined, body: unknown, options: RequestOptions & {responseType: 'text'}): Promise<string | null>;
  call<T = unknown>(name: string, params?: Params, body?: unknown, options?: RequestOptions & {responseType?: 'auto' | 'json'}): Promise<T | null>;
  call(name: string, params: Params | undefined, body: unknown, options: RequestOptions): Promise<unknown>;
  loadRoutes(refresh?: boolean): Promise<CapabilityMap>;
  refreshCapabilities(): Promise<CapabilityMap>;
  invalidateCapabilities(): void;
  subscribeCapabilities(listener: (routes: CapabilityMap | null) => void): () => void;
  has(name: string): Promise<boolean>;
}
export interface ClientOptions {
  fetch?: typeof globalThis.fetch;
  capabilitiesUrl?: string;
  baseUrl?: string;
  credentials?: RequestCredentials;
  getToken?: () => string | null | undefined;
}
export class ApiError extends Error {
  constructor(capability: string, response: Response, body: string);
  readonly status: number;
  readonly capability: string;
  readonly body: string;
  readonly data: unknown;
  readonly response: Response;
}
export function createApiClient(options?: ClientOptions): ApiClient;
export function fillUrl(template: string, params?: Params): string;
export function buildQuery(params?: Params): string;
export const api: ApiClient;
export const apiCall: ApiClient['call'];
export const loadRoutes: ApiClient['loadRoutes'];
