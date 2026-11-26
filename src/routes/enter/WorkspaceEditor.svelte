<script lang="ts">
 import { tick } from 'svelte';
 import TagEditor from '$lib/TagEditor.svelte';
 import EnterTree from './EnterTree.svelte';
 import type { Draft } from '$lib/types';
 import { ApiError, message } from '$lib/workspace';
 import type { Entry } from './sample-tree';
 import { getVisibleEntries, saveWorkspace, type WorkspaceTree } from './workspaces';

 export let draft: Draft;
 export let initialTree: WorkspaceTree;

 const workspaceId = draft.revision.document_id;
 let entries = initialTree.entries;
 let trashedIds = initialTree.trashedIds;
 let savedSnapshot = JSON.stringify(initialTree);
 let saving = false;
 let activeId = getVisibleEntries(entries, new Set(trashedIds))[0]?.id ?? 0;
 let trashStatus = '';
 let trashSummary: HTMLElement;
 let storageError = '';
 let tree: HTMLDialogElement;
 let menu: HTMLDetailsElement;
 let expanded = true;
 let editingName = false;
 let editNameButton: HTMLButtonElement;
 let interestInput: HTMLInputElement;
 $: activeIndex = entries.findIndex(entry => entry.id === activeId);
 $: trashed = new Set(trashedIds);
 $: trashEntries = entries.filter(entry => trashed.has(entry.id));
 $: visibleEntries = getVisibleEntries(entries, trashed);
 $: visibleIds = new Set(visibleEntries.map(entry => entry.id));

 $: snapshot = JSON.stringify({ ...initialTree, entries, trashedIds });
 $: dirty = snapshot !== savedSnapshot;

 function selectEntry(id: number) {
  activeId = id;
  expanded = true;
  editingName = false;
 }

 async function editName() {
  editingName = true;
  await tick();
  interestInput.focus();
 }

 async function finishNameEdit() {
  editingName = false;
  await tick();
  editNameButton.focus();
 }

 function addEntry(parentId: number | null) {
  const id = Math.max(...entries.map(entry => entry.id)) + 1;
  const position = activeIndex + 1;
  entries = [
   ...entries.slice(0, position),
   { id, parentId, interest: '', tags: [], location: '', notes: '' },
   ...entries.slice(position)
  ];
  menu.open = false;
  selectEntry(id);
  void editName();
 }

 async function moveToTrash() {
  const entry = entries[activeIndex];
  trashedIds = [...trashedIds, entry.id];
  const remaining = getVisibleEntries(entries, new Set(trashedIds));
  const next = remaining.find(candidate => candidate.id === entry.parentId) ?? remaining[0];
  if (next) selectEntry(next.id);
  trashStatus = `Moved “${entry.interest.trim() || 'Untitled Enter'}” to Trash.`;
  await tick();
  trashSummary.focus();
 }

 function restoreEntry(entry: Entry) {
  trashedIds = trashedIds.filter(id => id !== entry.id);
  if (!visibleEntries.length) selectEntry(entry.id);
  trashStatus = `Restored “${entry.interest.trim() || 'Untitled Enter'}”.`;
  trashSummary.focus();
 }

 function startDo(id: number) {
  void save(`/enter/do/?workspace=${encodeURIComponent(workspaceId)}&enter=${id}`);
 }

 function closeWorkspace() {
  if (saving || (dirty && !window.confirm('Close this workspace without saving your changes?'))) return;
  window.location.assign('/enter/');
 }

 async function save(destination?: string) {
  if (saving) return;
  saving = true;
  storageError = '';
  try {
   if (dirty) {
    draft = await saveWorkspace(draft.title, JSON.parse(snapshot), draft, workspaceId);
    savedSnapshot = draft.details ?? snapshot;
   }
   if (destination) window.location.assign(destination);
  } catch (error) {
   storageError = error instanceof ApiError && error.status === 409
    ? 'A newer version was saved elsewhere. Your edits are still here.'
    : message(error);
  } finally {
   saving = false;
  }
 }
</script>

<svelte:head>
 <title>{draft.title} · Enter Workspaces</title>
</svelte:head>

<main class="enter-shell">
 <header>
  <a class="text-link" href="/enter/" on:click|preventDefault={closeWorkspace}>Enter Workspaces</a>
  <h1>{draft.title}</h1>
  <div class="workspace-actions">
   <p class="fine" role="status">{saving ? 'Saving…' : dirty ? 'Unsaved changes' : 'Saved'}</p>
   <div class="workspace-buttons">
    <button type="button" class="button primary" disabled={saving || !visibleIds.has(activeId)} on:click={() => startDo(activeId)}>DO</button>
    <button type="button" class="button" disabled={saving || !dirty} on:click={() => save()}>Save</button>
    <button type="button" class="button" disabled={saving} on:click={closeWorkspace}>Close</button>
   </div>
  </div>
 </header>

 <div class="panel inline-tree" hidden={!visibleEntries.length} inert={saving}>
  <EnterTree entries={visibleEntries} {activeId} select={selectEntry} editActive>
    <section class="enter-card" class:collapsed={!expanded} aria-label="Enter details">
     <div class="active-title">
      {#if editingName}
       <form class="enter-name" on:submit|preventDefault={finishNameEdit}>
        <input aria-label="Enter name" type="text" bind:this={interestInput} bind:value={entries[activeIndex].interest}>
        <button type="submit" class="button">OK</button>
       </form>
      {:else}
       <div class="enter-name">
        <button type="button" class="enter-disclosure" aria-expanded={expanded} aria-controls="active-enter-details" on:click={() => { expanded = !expanded; }}>
         <span aria-hidden="true">{expanded ? '▾' : '▸'}</span>
         {entries[activeIndex].interest.trim() || 'Untitled Enter'}
        </button>
        <button type="button" class="icon-button edit-name" aria-label="Edit Enter name" title="Edit Enter name" bind:this={editNameButton} on:click={editName}>
         <span aria-hidden="true">✎</span>
        </button>
       </div>
      {/if}
     </div>
     <div id="active-enter-details" hidden={!expanded}>
      <div class="row wrap enter-actions">
       <details class="add-more" bind:this={menu}>
        <summary class="button">Add More</summary>
        <ul>
         <li><button type="button" class="button" on:click={() => addEntry(activeId)}>Add Baby</button></li>
         <li><button type="button" class="button" on:click={() => addEntry(entries[activeIndex].parentId)}>Add Peer</button></li>
         <li><button type="button" class="button" on:click={() => { menu.open = false; tree.showModal(); }}>See Tree</button></li>
        </ul>
       </details>
       <button type="button" class="button" on:click={moveToTrash}>Move to Trash</button>
      </div>

      <div class="interest-details" role="group" aria-labelledby="details-heading">
       <h2 id="details-heading">Details</h2>
       <div class="field">
        <span id="enter-tags">Tags</span>
        <div role="group" aria-labelledby="enter-tags">
         <TagEditor bind:tags={entries[activeIndex].tags} />
        </div>
       </div>
       <div class="field">
        <label for="location">Location</label>
        <input id="location" type="text" bind:value={entries[activeIndex].location}>
       </div>
       <div class="field">
        <label for="notes">Notes</label>
        <textarea id="notes" rows="3" bind:value={entries[activeIndex].notes}></textarea>
       </div>
      </div>
     </div>
    </section>
  </EnterTree>
 </div>

 {#if !visibleEntries.length}
  <p>No Enters in the tree.</p>
 {/if}
 {#if storageError}<p class="alert" role="alert">{storageError}</p>{/if}

 {#if initialTree.commits?.length}
  <details class="panel trash">
   <summary>Saved commits ({initialTree.commits.length})</summary>
   <ul>
    {#each [...initialTree.commits].reverse() as commit (commit.id)}
     <li>
      <a class="text-link" href={`/enter/commit/?workspace=${encodeURIComponent(workspaceId)}&commit=${encodeURIComponent(commit.id)}`}>
       {entries.find(entry => entry.id === commit.startingEnterId)?.interest.trim() || 'Untitled Enter'}
      </a>
      <small>{new Date(commit.savedAt).toLocaleString()}</small>
     </li>
    {/each}
   </ul>
  </details>
 {/if}

 <details class="panel trash" inert={saving}>
  <summary bind:this={trashSummary}>Trash ({trashEntries.length})</summary>
  {#if trashEntries.length}
   <ul>
    {#each trashEntries as entry (entry.id)}
     <li>
      <span>{entry.interest.trim() || 'Untitled Enter'}</span>
      {#if entry.parentId !== null && !visibleIds.has(entry.parentId)}
       <small>Restore its parent first.</small>
      {:else}
       <button type="button" class="button" on:click={() => restoreEntry(entry)}>Restore</button>
      {/if}
     </li>
    {/each}
   </ul>
  {:else}
   <p>Trash is empty.</p>
  {/if}
 </details>
 <p role="status">{trashStatus}</p>

 <dialog class="modal" bind:this={tree} aria-labelledby="tree-heading">
  <h2 id="tree-heading">Enter tree</h2>
  <EnterTree entries={visibleEntries} {activeId} select={(id) => { selectEntry(id); tree.close(); }} />
  <button type="button" class="button" on:click={() => tree.close()}>Close</button>
 </dialog>
</main>

<style>
 h1 { margin: 0; }
 .workspace-actions, .workspace-buttons, .enter-name {
  display: flex;
  align-items: center;
  gap: .5rem;
 }
 .workspace-actions {
  justify-content: space-between;
  flex-wrap: wrap;
  margin: .5rem 0 1rem;
 }
 .workspace-actions p { margin: 0; }
 .workspace-buttons { flex-wrap: wrap; margin-left: auto; }
 .inline-tree, .trash { margin-bottom: 1rem; }

 .inline-tree :global(ul.enter-tree) { list-style: none; margin: 0; padding: 0; }
 .inline-tree :global(li > ul.enter-tree) {
  border-left: 1px solid var(--line);
  margin-left: .65rem;
  padding-left: clamp(.5rem, 2.5vw, 1.25rem);
 }
 .inline-tree :global(.enter-tree-title > .text-button), .enter-disclosure {
  border: 0;
  padding: .45rem;
  background: transparent;
  color: inherit;
  font-size: 1rem;
  text-align: left;
  overflow-wrap: anywhere;
 }
 .inline-tree :global(.enter-tree-title > .text-button) { width: 100%; }
 .enter-card { margin: .25rem 0; padding: .75rem; border: 1px solid var(--line); border-radius: 6px; }
 .enter-card.collapsed { padding: .25rem; }
 .active-title { background: #e9eddf; border-radius: 6px; }
 .enter-name { padding: .25rem; }
 .enter-name input { min-width: 0; }
 .enter-disclosure { font-weight: 650; }
 .edit-name { flex: none; font-size: 1.1rem; }

 .enter-actions, .interest-details { margin-top: 1rem; }
 .interest-details { border-top: 1px solid var(--line); padding-top: 1rem; }
 #enter-tags { font-weight: 600; }
 .add-more { position: relative; }
 .add-more summary::after { content: " ▾"; }
 .add-more ul {
  position: absolute;
  z-index: 1;
  min-width: 9rem;
  list-style: none;
  margin: .25rem 0 0;
  padding: .4rem;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: #fffefa;
 }
 .add-more li + li, .trash li + li { margin-top: .4rem; }
 .add-more button { justify-content: flex-start; width: 100%; }
 .trash summary { cursor: pointer; font-weight: 650; }
 .trash li button { margin-left: .5rem; }
 .trash li small { display: block; }
</style>
