<script lang="ts">
 import { page } from '$app/stores';
 import WorkspaceEditor from './WorkspaceEditor.svelte';
 import WorkspaceList from './WorkspaceList.svelte';
 import { openWorkspace } from './workspaces';
 import { message } from '$lib/workspace';

 $: id = $page.url.searchParams.get('workspace');
 $: workspace = id ? openWorkspace(id) : null;
</script>

{#if workspace}
 {#key workspace}
  {#await workspace}
   <main class="enter-shell"><p role="status">Opening workspace…</p></main>
  {:then loaded}
   <WorkspaceEditor draft={loaded.draft} initialTree={loaded.tree} />
  {:catch error}
   <main class="enter-shell">
    <p role="alert">{message(error)}</p>
    <a class="text-link" href="/enter/">Back to Enter Workspaces</a>
   </main>
  {/await}
 {/key}
{:else}
 <WorkspaceList />
{/if}
