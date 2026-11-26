<script lang="ts">
 import { onMount } from 'svelte';
 import { goto } from '$app/navigation';
 import type { Draft } from '$lib/types';
 import { message } from '$lib/workspace';
 import { listWorkspaces, saveWorkspace, workspaceUrl } from './workspaces';

 let workspaces: Draft[] = [];
 let loading = true;
 let listError = '';
 let creating = false;
 let createError = '';
 let title = '';
 let pendingId: string | null = null;

 async function load() {
  loading = true;
  listError = '';
  try {
   workspaces = await listWorkspaces();
  } catch (error) {
   listError = message(error);
  } finally {
   loading = false;
  }
 }
 onMount(() => { void load(); });

 async function createWorkspace() {
  const name = title.trim();
  if (!name || creating) return;
  creating = true;
  createError = '';
  pendingId ??= crypto.randomUUID();
  try {
   await saveWorkspace(name, {
    version: 1,
    entries: [{ id: 1, parentId: null, interest: name, tags: [], location: '', notes: '' }],
    trashedIds: []
   }, null, pendingId);
   await goto(workspaceUrl(pendingId));
  } catch (error) {
   createError = message(error);
  } finally {
   creating = false;
  }
 }
</script>

<svelte:head><title>Enter Workspaces</title></svelte:head>

<main class="enter-shell">
 <a class="text-link" href="/">My workspace</a>
 <h1>Enter Workspaces</h1>
 <form class="panel" on:submit|preventDefault={createWorkspace}>
  <label for="workspace-name">Workspace name</label>
  <div class="row wrap">
   <input id="workspace-name" required bind:value={title} disabled={creating} />
   <button class="button primary" disabled={creating || !title.trim()}>{creating ? 'Creating…' : 'New Workspace'}</button>
  </div>
  {#if createError}<p class="alert" role="alert">{createError}</p>{/if}
 </form>

 {#if loading}
  <p role="status">Loading workspaces…</p>
 {:else if listError}
  <p class="alert" role="alert">{listError}</p>
  <button type="button" class="button" on:click={load}>Try again</button>
 {:else if workspaces.length}
  <ul>
   {#each workspaces as draft (draft.revision.document_id)}
    <li class="row between wrap">
     <a class="text-link" href={workspaceUrl(draft.revision.document_id)}>{draft.title}</a>
     <small>Saved {new Date(draft.revision.saved_at).toLocaleString()}</small>
    </li>
   {/each}
  </ul>
 {:else}
  <p>No Enter Workspaces yet.</p>
 {/if}
</main>

<style>
 form { margin-bottom: 1.25rem; }
 form label { margin: 0 0 .4rem; }
 input { flex: 1 1 14rem; }
 ul { padding: 0; }
 li { padding: .75rem 0; border-bottom: 1px solid var(--line); }
</style>
