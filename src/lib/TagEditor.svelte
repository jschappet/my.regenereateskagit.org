<script lang="ts">
 import Icon from './Icon.svelte';
 import {normalizeTags} from './content.mjs';

 export let tags:string[]=[];
 export let markdownTags:string[]=[];
 export let disabled=false;
 export let availableTags:string[]=[];
 let dialog:HTMLDialogElement;
 let input='';
 let addButton:HTMLButtonElement;
 $: attached = new Set(normalizeTags(tags));
 $: additions = normalizeTags(input.split(',')).filter(tag => !attached.has(tag));
 $: query = normalizeTags([input.split(',').at(-1) ?? ''])[0] ?? '';
 $: suggestions = normalizeTags(availableTags)
  .filter(tag => !attached.has(tag) && tag.includes(query))
  .slice(0, 6);

 function open(){
  input='';
  dialog.showModal();
 }
 function add(selected: string[] = additions){
  if (disabled || !selected.length) return;
  tags = normalizeTags([...tags, ...selected]);
  dialog.close();
 }

 function chooseSuggestion(tag: string) {
  const precedingTags = input.split(',').slice(0, -1);
  add(normalizeTags([...precedingTags, tag]).filter(value => !attached.has(value)));
 }
 function remove(tag:string){
  tags=tags.filter(value=>value!==tag);
  addButton.focus();
 }
</script>

<section class="tag-editor" aria-label="Tags">
 <div class="row wrap">
  {#each tags as tag (tag)}
   <span class="tag-pill">
    #{tag}
    {#if !disabled}
     <button type="button" class="icon-button" aria-label={'Remove tag '+tag} on:click={()=>remove(tag)}>
      <Icon name="close" size={13}/>
     </button>
    {/if}
   </span>
  {/each}
  {#each markdownTags.filter(tag=>!tags.includes(tag)) as tag (tag)}
   <span class="tag-pill markdown-tag" title="Edit the hashtag in your notes to remove it">#{tag}</span>
  {/each}
  <button type="button" class="button small" {disabled} bind:this={addButton} on:click={open}>
   <Icon name="plus" size={14}/>Add tags
  </button>
 </div>
</section>

<dialog bind:this={dialog} class="modal" aria-label="Add tags" on:cancel|stopPropagation>
 <h2>Add tags</h2>
 <label>Search or enter tags
  <input bind:value={input} autocomplete="off" placeholder="e.g. community" on:keydown={event=>{
   if (event.key === 'Enter' && !event.isComposing) { event.preventDefault(); add(); }
  }}/>
 </label>
 {#if suggestions.length}
  <div class="suggestions" role="group" aria-label="Suggested tags">
   <p>Suggested tags</p>
   <div class="row wrap">
    {#each suggestions as tag (tag)}
     <button type="button" class="button secondary small" {disabled} on:click={() => chooseSuggestion(tag)}>#{tag}</button>
    {/each}
   </div>
  </div>
 {/if}
 <p class="fine">Choose a suggestion or enter new tags separated by commas.</p>
 <div class="row">
  <button type="button" class="button primary small" disabled={disabled||!additions.length} on:click={() => add()}>Add tags</button>
  <button type="button" class="text-button" on:click={()=>dialog.close()}>Cancel</button>
 </div>
</dialog>

<style>
 .suggestions { margin: 1rem 0; }
 .suggestions p { margin-bottom: .4rem; font-weight: 600; }
 .suggestions .row { gap: .4rem; }
 label + .fine { margin-top: .75rem; }
 .tag-editor{margin-block:1rem}
 .tag-pill{display:inline-flex;align-items:center;gap:.25rem;min-height:2.125rem;padding:.2rem .6rem;border:1px solid #dce2d0;border-radius:999px;background:#e9eddf;font-size:.875rem;max-width:100%;overflow-wrap:anywhere}
 .tag-pill .icon-button{padding:.2rem;color:inherit;border-radius:50%}
 .tag-pill .icon-button:hover{background:#d6dec9}
 .markdown-tag{background:#e6edf5;border-color:#ccd9e9;color:#294562}
</style>
