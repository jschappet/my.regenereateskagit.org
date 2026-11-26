<script lang="ts">
 import {onMount,onDestroy} from 'svelte';
 import {beforeNavigate} from '$app/navigation';
 import {api,dirtyEditor,message,notify,refreshDocuments,session} from '$lib/workspace';

 type Row={id:number;title:string;doc_type:string;status:string};
 type RawDraft={id:number;title:string;meta:unknown;body_md:string;revision_id:string};
 let rows:Row[]=[],selected:RawDraft|null=null,before:number|null=null;
 let meta='',body='',baselineMeta='',baselineBody='',error='',busy=false;
 $: dirty=!!selected&&(meta!==baselineMeta||body!==baselineBody);
 $: dirtyEditor.set(dirty);
 function mayLeave(){return !dirty||confirm('Discard your unsaved draft edits?');}
 beforeNavigate(({cancel,willUnload})=>{if(busy||(dirty&&(willUnload||!mayLeave())))cancel();});
 onDestroy(()=>dirtyEditor.set(false));

 async function list(append=false){
  if(busy)return;
  busy=true;error='';
  try{
   const result=await api.call<{drafts:Row[];before:number|null}>('draft_raw_list',append?{before}:{});
   if(!result)throw new Error('The server did not return drafts.');
   rows=append?[...rows,...result.drafts]:result.drafts;
   before=result.before;
  }catch(e){error=message(e);}
  finally{busy=false;}
 }

 function adopt(draft:RawDraft){
  selected=draft;
  meta=baselineMeta=JSON.stringify(draft.meta,null,2);
  body=baselineBody=draft.body_md;
 }

 async function open(id:number){
  if(busy||!mayLeave())return;
  busy=true;error='';
  try{
   const draft=await api.call<RawDraft>('draft_raw_get',{id});
   if(!draft)throw new Error('Draft not found.');
   adopt(draft);
  }catch(e){error=message(e);}
  finally{busy=false;}
 }

 async function save(){
  if(!selected||!dirty||busy)return;
  error='';
  let parsed:unknown;
  try{parsed=JSON.parse(meta);}
  catch{error='Enter valid JSON for the frontmatter.';return;}
  if(parsed!==null&&(typeof parsed!=='object'||Array.isArray(parsed))){
   error='Frontmatter must be a JSON object or null.';return;
  }
  busy=true;
  try{
   const id=selected.id;
   const result=await api.call<RawDraft>('draft_raw_save',{id},{meta:parsed,body_md:body,revision_id:selected.revision_id});
   if(!result)throw new Error('The server did not return the saved revision.');
   adopt(result);
   rows=rows.map(row=>row.id===id?{...row,id:result.id}:row);
   notify('Draft revision saved.');
   try{await refreshDocuments();}catch{/* The workspace displays the refresh error. */}
  }catch(e){error=message(e);}
  finally{busy=false;}
 }

 onMount(()=>{if($session.profile?.roles.includes('admin'))void list();});
</script>

<div class="page-heading"><h1>Draft administration</h1></div>
{#if !$session.profile?.roles.includes('admin')}
 <p class="panel">This page requires site administrator access.</p>
{:else}
 {#if error}<p class="alert" role="alert">{error}</p>{/if}
 {#if selected}
  <form class="panel" on:submit|preventDefault={save}>
   <h2>{selected.title}</h2>
   <fieldset disabled={busy}>
    <label>Frontmatter (JSON)<textarea rows="14" class="markdown-editor" bind:value={meta} spellcheck="false" required></textarea></label>
    <label>Markdown body<textarea rows="14" class="markdown-editor" bind:value={body}></textarea></label>
   </fieldset>
   <div class="row wrap">
    <button class="button primary" disabled={busy||!dirty}>Save revision</button>
    <button type="button" class="button" disabled={busy} on:click={()=>selected&&open(selected.id)}>Reload draft</button>
   </div>
  </form>
 {/if}
 <div class="panel">
  <div class="row between"><h2>Drafts</h2><button class="button" disabled={busy} on:click={()=>list()}>Refresh list</button></div>
  <ul>
   {#each rows as row (row.id)}
    <li><button class="text-button" disabled={busy} on:click={()=>open(row.id)}>{row.title}</button>
     <span class="fine"> · {row.doc_type} · {row.status} · #{row.id}</span></li>
   {:else}
    <li>{busy?'Loading drafts…':'No drafts to show.'}</li>
   {/each}
  </ul>
  {#if before!==null}<button class="button" disabled={busy} on:click={()=>list(true)}>Load more drafts</button>{/if}
 </div>
{/if}
