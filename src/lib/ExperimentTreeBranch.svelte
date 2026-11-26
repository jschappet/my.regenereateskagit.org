<script lang="ts">
 type Branch={id:string;title:string;href:string|null;via:string;children:Branch[]};
 export let branches:Branch[];
</script>

<ul class="branches">
 {#each branches as branch (branch.id)}
  <li>
   {#if branch.href}<a class="text-link" href={branch.href}>{branch.title}</a>
   {:else}<span>{branch.title}</span>{/if}
   {#if branch.via}<small>via {branch.via}</small>{/if}
   {#if branch.children.length}<svelte:self branches={branch.children}/>{/if}
  </li>
 {/each}
</ul>

<style>
 .branches{list-style:none;border-inline-start:2px solid #bccbb0;margin:8px 0;padding-inline-start:16px}
 li{padding:5px 0;overflow-wrap:anywhere}
 small{display:block;color:var(--muted)}
</style>
