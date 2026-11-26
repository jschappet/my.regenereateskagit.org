<script lang="ts">
 import type { Draft } from '$lib/types';
 import { ApiError, message } from '$lib/workspace';
 import { saveWorkspace, workspaceUrl, type WorkCommit, type WorkspaceTree } from '../workspaces';
 import CommitPhoto from './CommitPhoto.svelte';

 export let draft: Draft;
 export let tree: WorkspaceTree;
 export let initialCommit: WorkCommit;

 const workspaceId = draft.revision.document_id;
 const doUrl = `/enter/do/?${new URLSearchParams({workspace: workspaceId, enter: String(initialCommit.startingEnterId)})}`;
 let commit = structuredClone(initialCommit);
 let savedSnapshot = initialCommit.savedAt ? JSON.stringify(initialCommit) : '';
 let saving = false;
 let uploads = 0;
 let error = '';

 $: snapshot = JSON.stringify(commit);
 $: dirty = snapshot !== savedSnapshot;

 function trackUpload(active: boolean) {
  uploads += active ? 1 : -1;
 }

 async function save() {
  if (saving || uploads || !dirty) return;
  const updated: WorkCommit = {
   ...commit,
   savedAt: new Date().toISOString(),
   results: commit.results.map(result => ({ ...result, actualMinutes: result.actualMinutes ?? null }))
  };
  const commits = tree.commits ?? [];
  const nextTree = {
   ...tree,
   commits: commits.some(item => item.id === commit.id)
    ? commits.map(item => item.id === commit.id ? updated : item)
    : [...commits, updated]
  };
  saving = true;
  error = '';
  try {
   draft = await saveWorkspace(draft.title, nextTree, draft, workspaceId);
   tree = nextTree;
   commit = updated;
   savedSnapshot = JSON.stringify(updated);
  } catch (cause) {
   error = cause instanceof ApiError && cause.status === 409
    ? 'A newer workspace version was saved elsewhere. Your commit edits are still here.'
    : message(cause);
  } finally {
   saving = false;
  }
 }
</script>

<form on:submit|preventDefault={save}>
 <header>
  <div class="row wrap">
   <a class="text-link" href={doUrl}>Back to Do</a>
   <a class="text-link" href={workspaceUrl(workspaceId)}>Enter Workspace</a>
  </div>
  <h1>Commit</h1>
  <div class="row wrap between commit-actions">
   <p class="fine" role="status">{saving ? 'Saving…' : dirty ? 'Unsaved changes' : 'Saved'}</p>
   <div class="row wrap">
    {#if !dirty}
     <a class="button" href={`/enter/story/?${new URLSearchParams({workspace: workspaceId, commit: commit.id})}`}>{commit.storyMarkdown === undefined ? 'Create a story' : 'Open story'}</a>
    {/if}
    <button class="button primary" type="submit" disabled={saving || uploads > 0 || !dirty}>Save Commit</button>
   </div>
  </div>
  {#if error}<p class="alert" role="alert">{error}</p>{/if}
  <p>{draft.title} · Mark the Enters in your work set as Done or Postponed.</p>
  <p class="fine">Photos use shareable upload links. Anyone with a photo link may be able to view it.</p>
 </header>

 {#each commit.results as result (result.entryId)}
  <fieldset class="panel" disabled={saving}>
   <legend>{tree.entries.find(entry => entry.id === result.entryId)?.interest.trim() || 'Untitled Enter'}</legend>
   <div class="row wrap">
    <label class="status">
     <input type="radio" name={`status-${result.entryId}`} value="done" bind:group={result.status} />
     <span class="button small">Done</span>
    </label>
    <label class="status">
     <input type="radio" name={`status-${result.entryId}`} value="postponed" bind:group={result.status} />
     <span class="button small">Postponed</span>
    </label>
   </div>
   <div class="task-details">
    <label>Notes (optional) <textarea rows="2" bind:value={result.notes}></textarea></label>
    <div class="field-grid">
     <label>Actual time (minutes, optional) <input type="number" min="0" step="1" bind:value={result.actualMinutes} /></label>
     <label>Date completed (optional) <input type="date" bind:value={result.completedOn} /></label>
    </div>
    <div class="field-grid">
     <CommitPhoto label="Before photo (optional)" bind:url={result.beforePhoto} disabled={saving} onUploadChange={trackUpload} />
     <CommitPhoto label="After photo (optional)" bind:url={result.afterPhoto} disabled={saving} onUploadChange={trackUpload} />
    </div>
   </div>
  </fieldset>
 {/each}
</form>

<style>
 h1 { margin: 0; }
 .commit-actions { margin: .5rem 0 1rem; }
 .commit-actions > p { margin: 0; }
 fieldset { margin-bottom: 1rem; }
 legend { font-weight: 700; }
 label { margin: 0; }
 .status { position: relative; cursor: pointer; }
 .status input { position: absolute; width: 1px; height: 1px; opacity: 0; }
 .status input:checked + span { background: var(--green); color: white; }
 .status input:focus-visible + span { outline: 2px solid var(--green); outline-offset: 3px; }
 .task-details, .field-grid { display: grid; gap: .75rem; }
 .task-details { margin-top: 1rem; }
 .field-grid { grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr)); }
</style>
