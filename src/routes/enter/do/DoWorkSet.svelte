<script lang="ts">
 import { goto } from '$app/navigation';
 import { tick } from 'svelte';
 import TagEditor from '$lib/TagEditor.svelte';
 import type { Draft } from '$lib/types';
 import { ApiError, message } from '$lib/workspace';
 import type { Entry } from '../sample-tree';
 import { getVisibleEntries, saveWorkspace, type WorkspaceTree } from '../workspaces';
 import WorkSet from './WorkSet.svelte';

 export let draft: Draft;
 export let tree: WorkspaceTree;
 export let selectedId: number;

 let dialog: HTMLDialogElement;
 let nameField: HTMLInputElement;
 let pending: Entry | null = null;
 let heading = '';
 let saving = false;
 let error = '';
 let status = '';
 let startDate = '';
 let endDate = '';
 let estimatedMinutes: number | undefined;
 let checkedIds = new Set(branchIds(getVisibleEntries(tree.entries, new Set(tree.trashedIds)), selectedId));

 $: entries = getVisibleEntries(tree.entries, new Set(tree.trashedIds));
 $: selected = entries.find(entry => entry.id === selectedId);

 function branchIds(visible: Entry[], rootId: number) {
  const children = new Map<number, number[]>();
  for (const entry of visible) {
   if (entry.parentId === null) continue;
   const siblings = children.get(entry.parentId) ?? [];
   siblings.push(entry.id);
   children.set(entry.parentId, siblings);
  }
  const ids = [rootId];
  for (const id of ids) {
   for (const child of children.get(id) ?? []) ids.push(child);
  }
  return ids;
 }

 function toggleBranch(id: number, checked: boolean) {
  const next = new Set(checkedIds);
  for (const branchId of branchIds(entries, id)) {
   if (checked) next.add(branchId);
   else next.delete(branchId);
  }
  checkedIds = next;
 }

 function goToCommit() {
  if (!checkedIds.size || saving) return;
  const params = new URLSearchParams({
   workspace: draft.revision.document_id,
   enter: String(selectedId),
   commit: crypto.randomUUID()
  });
  for (const entry of entries) {
   if (checkedIds.has(entry.id)) params.append('item', String(entry.id));
  }
  if (startDate) params.set('start', startDate);
  if (endDate) params.set('end', endDate);
  if (estimatedMinutes !== undefined) params.set('minutes', String(estimatedMinutes));
  void goto(`/enter/commit/?${params}`);
 }

 async function openEditor(entry: Entry, title: string) {
  pending = entry;
  heading = title;
  error = '';
  status = '';
  await tick();
  dialog.showModal();
  nameField.focus();
 }

 function editEntry(entry: Entry) {
  void openEditor({ ...entry, tags: [...entry.tags] }, 'Edit Enter');
 }

 function addChild(parent: Entry) {
  const id = Math.max(...tree.entries.map(entry => entry.id)) + 1;
  void openEditor(
   { id, parentId: parent.id, interest: '', tags: [], location: '', notes: '' },
   `Add Baby to ${parent.interest.trim() || 'Untitled Enter'}`
  );
 }

 async function save() {
  if (!pending || !pending.interest.trim() || saving) return;
  const entry = { ...pending, interest: pending.interest.trim() };
  const existing = tree.entries.some(item => item.id === entry.id);
  const updated = {
   ...tree,
   entries: existing ? tree.entries.map(item => item.id === entry.id ? entry : item) : [...tree.entries, entry]
  };
  saving = true;
  error = '';
  try {
   draft = await saveWorkspace(draft.title, updated, draft, draft.revision.document_id);
   tree = updated;
   if (!existing && entry.parentId !== null && checkedIds.has(entry.parentId)) {
    checkedIds = new Set([...checkedIds, entry.id]);
   }
   dialog.close();
   status = existing ? 'Enter saved.' : 'Child Enter added.';
  } catch (cause) {
   error = cause instanceof ApiError && cause.status === 409
    ? 'A newer workspace version was saved elsewhere. Your edits are still here.'
    : message(cause);
  } finally {
   saving = false;
  }
 }
</script>

<div class="do-actions">
 <button class="button primary" type="submit" form="do-timing" disabled={!checkedIds.size || saving}>Commit</button>
</div>
<p>{draft.title} · Starting Enter <strong>{selected?.interest.trim() || 'Untitled Enter'}</strong></p>
<fieldset class="panel">
 <legend>Choose your work set</legend>
 <WorkSet {entries} {selectedId} {checkedIds} {toggleBranch} {editEntry} {addChild} />
</fieldset>
<p role="status">{status}</p>
<form id="do-timing" on:submit|preventDefault={goToCommit}>
 <fieldset class="panel">
  <legend>Work set timing</legend>
  <div class="timing">
   <label>Start date <input type="date" bind:value={startDate} max={endDate || undefined} /></label>
   <label>End date <input type="date" bind:value={endDate} min={startDate || undefined} /></label>
   <label>Estimated time (minutes) <input type="number" min="1" step="1" bind:value={estimatedMinutes} /></label>
  </div>
 </fieldset>
</form>

<dialog class="modal" bind:this={dialog} aria-labelledby="edit-enter-heading" on:cancel={(event) => { if (saving) event.preventDefault(); }}>
 <h2 id="edit-enter-heading">{heading}</h2>
 {#if pending}
  <form on:submit|preventDefault={save}>
   <label>Enter name <input bind:this={nameField} bind:value={pending.interest} required disabled={saving} /></label>
   <TagEditor bind:tags={pending.tags} disabled={saving} />
   <label>Location <input bind:value={pending.location} disabled={saving} /></label>
   <label>Notes <textarea rows="3" bind:value={pending.notes} disabled={saving}></textarea></label>
   {#if error}<p class="alert" role="alert">{error}</p>{/if}
   <div class="row wrap">
    <button type="submit" class="button primary" disabled={saving || !pending.interest.trim()}>{saving ? 'Saving…' : 'Save Enter'}</button>
    <button type="button" class="button" disabled={saving} on:click={() => dialog.close()}>Cancel</button>
   </div>
  </form>
 {/if}
</dialog>

<style>
 .do-actions { display: flex; justify-content: flex-end; margin: .5rem 0 1rem; }
 fieldset { margin-bottom: 1rem; }
 .timing { display: grid; grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr)); gap: .75rem; }
 .timing label { margin: 0; }
 legend { font-weight: 700; }
 form .row { margin-top: 1rem; }
</style>
