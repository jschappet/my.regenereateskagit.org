<script lang="ts">
 export let entries: { id: number; parentId: number | null; interest: string }[];
 export let activeId: number;
 export let select: (id: number) => void;
 export let editActive = false;
 export let parentId: number | null = null;

 $: children = entries.filter(entry => entry.parentId === parentId);
</script>

{#if children.length}
 <ul class="enter-tree">
  {#each children as entry (entry.id)}
   <li>
    {#if editActive && activeId === entry.id}
     <slot />
    {:else}
     <div class="enter-tree-title">
      <button type="button" class="text-button" aria-current={activeId === entry.id ? 'true' : undefined} on:click={() => select(entry.id)}>
       {entry.interest.trim() || 'Untitled Enter'}
      </button>
     </div>
    {/if}
    <svelte:self {entries} {activeId} {select} {editActive} parentId={entry.id}>
     <slot />
    </svelte:self>
   </li>
  {/each}
 </ul>
{/if}
