<script lang="ts">
 import {draftTags} from './content.mjs';
 import type {Draft} from './types';
 export let draft:Draft;
 $: tags=draftTags(draft);
 $: metadata=Object.fromEntries(Object.entries(draft.meta??{}).filter(([key])=>!['links','tags'].includes(key)));
</script>

<div class="saved-content">
 {#if draft.description}<p>{draft.description}</p>{/if}
 {#if draft.body_md}<div class="readable-markdown">{draft.body_md}</div>{/if}
 {#if tags.length}<p>{tags.map(tag=>'#'+tag).join(' ')}</p>{/if}
 {#if Object.keys(metadata).length||draft.details}
  <details>
   <summary>Saved details</summary>
   {#if Object.keys(metadata).length}<pre class="readable-markdown">{JSON.stringify(metadata,null,2)}</pre>{/if}
   {#if draft.details}<pre class="readable-markdown">{draft.details}</pre>{/if}
  </details>
 {/if}
 {#if !draft.body_md&&!draft.description&&!tags.length&&!Object.keys(metadata).length&&!draft.details}
  <p>No notes saved.</p>
 {/if}
</div>

<style>.saved-content{margin:14px 0;color:var(--ink)}</style>
