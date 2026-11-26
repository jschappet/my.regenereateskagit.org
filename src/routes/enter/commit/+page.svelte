<script lang="ts">
 import { page } from '$app/stores';
 import { message } from '$lib/workspace';
 import { getVisibleEntries, openWorkspace, type WorkCommit } from '../workspaces';
 import CommitEditor from './CommitEditor.svelte';

 $: params = $page.url.searchParams;
 $: commit = loadCommit(params);

 async function loadCommit(params: URLSearchParams) {
  const workspaceId = params.get('workspace');
  const id = params.get('commit');
  if (!workspaceId || !id) throw new Error('Choose a work set on the Do page to start a commit.');

  const { draft, tree } = await openWorkspace(workspaceId);
  const saved = tree.commits?.find(commit => commit.id === id);
  if (saved) return { draft, tree, initialCommit: saved };

  const entries = getVisibleEntries(tree.entries, new Set(tree.trashedIds));
  const startingEnterId = Number(params.get('enter'));
  const ids = new Set(params.getAll('item').map(Number));
  const workSet = entries.filter(entry => ids.has(entry.id));
  if (!entries.some(entry => entry.id === startingEnterId) || !workSet.length || workSet.length !== ids.size) {
   throw new Error('The work set has changed. Return to Do and choose the Enters again.');
  }

  const minutes = Number(params.get('minutes'));
  const initialCommit: WorkCommit = {
   id, startingEnterId,
   timing: {
    startDate: params.get('start') ?? '',
    endDate: params.get('end') ?? '',
    estimatedMinutes: Number.isSafeInteger(minutes) && minutes > 0 ? minutes : null
   },
   results: workSet.map(entry => ({
    entryId: entry.id, status: '', notes: '', actualMinutes: null, completedOn: '', beforePhoto: '', afterPhoto: ''
   })),
   savedAt: ''
  };
  return { draft, tree, initialCommit };
 }
</script>

<svelte:head><title>Commit · Enter Workspaces</title></svelte:head>

<main class="enter-shell">
 {#key commit}
  {#await commit}
   <p role="status">Loading commit…</p>
  {:then result}
   <CommitEditor draft={result.draft} tree={result.tree} initialCommit={result.initialCommit} />
  {:catch error}
   <h1>Commit</h1>
   <p class="alert" role="alert">{message(error)}</p>
   {#if params.has('workspace') && params.has('enter')}
    <a class="text-link" href={`/enter/do/?${new URLSearchParams({workspace: params.get('workspace')!, enter: params.get('enter')!})}`}>Back to Do</a>
   {:else}
    <a class="text-link" href="/enter/">Enter Workspaces</a>
   {/if}
  {/await}
 {/key}
</main>
