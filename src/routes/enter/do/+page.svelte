<script lang="ts">
 import { page } from '$app/stores';
 import { message } from '$lib/workspace';
 import DoWorkSet from './DoWorkSet.svelte';
 import { getVisibleEntries, openWorkspace, workspaceUrl } from '../workspaces';

 $: workspaceId = $page.url.searchParams.get('workspace');
 $: selectedId = Number($page.url.searchParams.get('enter'));
 $: workSet = loadWorkSet(workspaceId, selectedId);

 async function loadWorkSet(id: string | null, start: number) {
  if (!id || !Number.isSafeInteger(start) || start < 1) throw new Error('Choose a starting Enter from your workspace.');
  const { draft, tree } = await openWorkspace(id);
  const entries = getVisibleEntries(tree.entries, new Set(tree.trashedIds));
  const selected = entries.find(entry => entry.id === start);
  if (!selected) throw new Error('The starting Enter is no longer in this workspace.');
  return { draft, tree, selectedId: selected.id };
 }
</script>

<svelte:head><title>Do · Enter Workspaces</title></svelte:head>

<main class="enter-shell">
 <header>
  <a class="text-link" href={workspaceId ? workspaceUrl(workspaceId) : '/enter/'}>Back to Enter Workspace{workspaceId ? '' : 's'}</a>
  <h1>Do</h1>
 </header>
 {#key workSet}
  {#await workSet}
   <p role="status">Loading work set…</p>
  {:then result}
   <DoWorkSet draft={result.draft} tree={result.tree} selectedId={result.selectedId} />
  {:catch error}
   <p class="alert" role="alert">{message(error)}</p>
  {/await}
 {/key}
</main>

<style>
 h1 { margin: 0; }
</style>
