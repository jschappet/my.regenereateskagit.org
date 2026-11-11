<script lang="ts">
 import Icon from './Icon.svelte';
 import {normalizeTags} from './content.mjs';

 export let tags:string[]=[];
 export let markdownTags:string[]=[];
 export let disabled=false;
 let dialog:HTMLDialogElement;
 let input='';
 let addButton:HTMLButtonElement;
 $: additions=normalizeTags(input.split(','));

 function open(){
  input='';
  dialog.showModal();
 }
 function add(){
  if(disabled||!additions.length)return;
  tags=normalizeTags([...tags,...additions]);
  dialog.close();
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
 <label>New tags
  <input bind:value={input} placeholder="food, community" on:keydown={event=>{
   if(event.key==='Enter'){event.preventDefault();add();}
  }}/>
 </label>
 <p class="fine">Separate multiple tags with commas. Hashtags in your notes are also picked up when you save.</p>
 <div class="row">
  <button type="button" class="button primary small" disabled={disabled||!additions.length} on:click={add}>Add tags</button>
  <button type="button" class="text-button" on:click={()=>dialog.close()}>Cancel</button>
 </div>
</dialog>

<style>
 .tag-editor{margin-block:1rem}
 .tag-pill{display:inline-flex;align-items:center;gap:.25rem;min-height:2.125rem;padding:.2rem .6rem;border:1px solid #dce2d0;border-radius:999px;background:#e9eddf;font-size:.875rem}
 .tag-pill .icon-button{padding:.2rem;color:inherit;border-radius:50%}
 .tag-pill .icon-button:hover{background:#d6dec9}
 .markdown-tag{background:#e6edf5;border-color:#ccd9e9;color:#294562}
</style>
