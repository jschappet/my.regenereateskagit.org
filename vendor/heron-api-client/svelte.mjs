import {api} from './heron-client.mjs';

/** Svelte's store contract, without a dependency on Svelte or a second transport. */
export function createCapabilityStore(client = api) {
  return {
    subscribe: client.subscribeCapabilities,
    load: () => client.loadRoutes(),
    refresh: () => client.refreshCapabilities(),
  };
}

export const capabilities = createCapabilityStore();
export {api};
