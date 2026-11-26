<script lang="ts">
 import type { Entry } from '../sample-tree';

 export let entries: Entry[];
 export let selectedId: number;
 export let checkedIds: Set<number>;
 export let toggleBranch: (id: number, checked: boolean) => void;
 export let editEntry: (entry: Entry) => void;
 export let addChild: (entry: Entry) => void;
 export let parentId: number | null = null;

 $: children = entries.filter(entry => entry.parentId === parentId);
</script>

{#if children.length}
 <ul role="list">
  {#each children as entry (entry.id)}
   <li>
    <div class="entry-row" class:start={entry.id === selectedId}>
     <label>
      <input type="checkbox" value={entry.id} checked={checkedIds.has(entry.id)} on:change={(event) => toggleBranch(entry.id, event.currentTarget.checked)} />
      <span>{entry.interest.trim() || 'Untitled Enter'}</span>
     </label>
     <div class="row wrap">
      <button type="button" class="button small" aria-label={`Edit ${entry.interest.trim() || 'Untitled Enter'}`} on:click={() => editEntry(entry)}>Edit</button>
      <button type="button" class="button small" aria-label={`Add Baby to ${entry.interest.trim() || 'Untitled Enter'}`} on:click={() => addChild(entry)}>Add Baby</button>
     </div>
    </div>
    <svelte:self {entries} {selectedId} {checkedIds} {toggleBranch} {editEntry} {addChild} parentId={entry.id} />
   </li>
  {/each}
 </ul>
{/if}

<style>
 ul { list-style: none; margin: 0; padding: 0; }
 li > :global(ul) { border-left: 1px solid var(--line); margin-left: .65rem; padding-left: clamp(.5rem, 2.5vw, 1.25rem); }
 label { display: flex; align-items: flex-start; gap: .6rem; margin: 0; padding: .45rem; font-size: 1rem; cursor: pointer; }
 input { flex: none; width: 1rem; margin: .25rem 0 0; }
 .entry-row { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: .35rem; padding: .25rem; }
 .start { background: #e9eddf; }
</style>
