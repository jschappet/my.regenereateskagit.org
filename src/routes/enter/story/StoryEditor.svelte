<script lang="ts">
 import { renderMarkdown } from '$lib/markdown.mjs';
 import type { Draft } from '$lib/types';
 import { ApiError, message } from '$lib/workspace';
 import { saveWorkspace, type WorkCommit, type WorkspaceTree } from '../workspaces';

 export let draft: Draft;
 export let tree: WorkspaceTree;
 export let commit: WorkCommit;
 export let initialMarkdown: string;

 let markdown = initialMarkdown;
 let savedMarkdown = commit.storyMarkdown;
 let preview = false;
 let saving = false;
 let error = '';

 $: dirty = markdown !== savedMarkdown;

 async function save() {
  if (saving || !dirty) return;
  const text = markdown;
  const updated = {
   ...tree,
   commits: tree.commits?.map(item => item.id === commit.id ? { ...item, storyMarkdown: text } : item)
  };

  saving = true;
  error = '';
  try {
   draft = await saveWorkspace(draft.title, updated, draft, draft.revision.document_id);
   tree = updated;
   savedMarkdown = text;
  } catch (cause) {
   error = cause instanceof ApiError && cause.status === 409
    ? 'A newer workspace version was saved elsewhere. Your story edits are still here.'
    : message(cause);
  } finally {
   saving = false;
  }
 }
</script>

<div class="row wrap between story-actions">
 <p class="fine" role="status">{saving ? 'Saving…' : dirty ? 'Unsaved changes' : 'Saved'}</p>
 <button type="button" class="button primary" disabled={saving || !dirty} on:click={save}>Save Story</button>
</div>
{#if error}<p class="alert" role="alert">{error}</p>{/if}

<div class="panel">
 <p id="story-help">Use the saved commit as a starting point. Edit the story in your own words.</p>
 <div class="row wrap story-views" role="group" aria-label="Story view">
  <button type="button" class="button" class:primary={!preview} aria-pressed={!preview} on:click={() => { preview = false; }}>Edit</button>
  <button type="button" class="button" class:primary={preview} aria-pressed={preview} on:click={() => { preview = true; }}>Preview</button>
 </div>
 {#if preview}
  <div class="invitation-body story-preview" role="region" aria-label="Story preview">
   {@html renderMarkdown(markdown)}
  </div>
 {:else}
  <label for="story">Story (Markdown)</label>
  <textarea id="story" aria-describedby="story-help" rows="22" bind:value={markdown}></textarea>
 {/if}
</div>

<style>
 .story-actions, .story-views { margin-bottom: 1rem; }
 .story-actions p { margin: 0; }
 .story-preview :global(img) { display: block; max-width: 100%; max-height: 32rem; object-fit: contain; border-radius: 6px; }
 textarea { font-family: ui-monospace, monospace; }
</style>
