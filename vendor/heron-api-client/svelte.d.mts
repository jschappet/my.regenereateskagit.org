import type {ApiClient, CapabilityMap} from './heron-client.mjs';
export interface CapabilityStore {
  subscribe(listener: (routes: CapabilityMap | null) => void): () => void;
  load(): Promise<CapabilityMap>;
  refresh(): Promise<CapabilityMap>;
}
export function createCapabilityStore(client?: ApiClient): CapabilityStore;
export const capabilities: CapabilityStore;
export {api} from './heron-client.mjs';
