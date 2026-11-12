<script lang="ts">
 import {goto} from '$app/navigation';
 import {createDialog,documents,saveDocument,message,notify} from './workspace';
 import {sourceLink} from './experiment-source.mjs';
 import type {Target} from './types';
 import Icon from './Icon.svelte';
 import TagEditor from './TagEditor.svelte';

 let dialog:HTMLDialogElement;
 let tags:string[]=[], newId='', title='', type='experiment', sourceId='', sourceUrl='', error='';
 let contextualSource:Target|undefined;
 let busy=false, wasOpen=false;
 $: choices=$documents.filter(doc=>['interest','experiment','idea','action','act'].includes(doc.doc_type)
  || doc.revision.document_id===contextualSource?.document_id);

 $: if(dialog&&$createDialog.open&&!wasOpen){
  wasOpen=true;
  newId=crypto.randomUUID();
  type=$createDialog.type;
  const source=$createDialog.source;
  const draft=typeof source==='string'?$documents.find(doc=>doc.revision.document_id===source):undefined;
  contextualSource=draft?{document_id:draft.revision.document_id,title:draft.title}
   :typeof source==='object'&&source.document_id?source:undefined;
  sourceId=contextualSource?.document_id??(typeof source==='object'&&source.url?'url':'');
  sourceUrl=typeof source==='object'?source.url??'':'';
  title=draft?.doc_type==='interest'?draft.title:'';
  tags=[];
  error='';
  dialog.showModal();
 }
 $: if(dialog&&!$createDialog.open&&wasOpen){wasOpen=false;dialog.close();}

 function close(){if(!busy)createDialog.set({open:false,type:'experiment'});}
 async function create(){
  if(busy)return;
  busy=true;
  error='';
  try{
   const draft=choices.find(doc=>doc.revision.document_id===sourceId);
   const target=sourceId===contextualSource?.document_id?contextualSource
    :draft?{document_id:draft.revision.document_id,title:draft.title}:undefined;
   if(type==='experiment'&&sourceId&&sourceId!=='url'&&!target)throw new Error('Choose an available Heron document.');
   const links=type!=='experiment'||!sourceId?[]
    :sourceId==='url'?sourceLink(undefined,sourceUrl)
    :sourceLink(target,sourceUrl);
   const meta={workspace_version:1,...(type==='experiment'?{workflow_version:2}:{}),links};
   await saveDocument({doc_type:type,title:title.trim(),body_md:'',tags:JSON.stringify(tags),meta},null,newId);
   createDialog.set({open:false,type});
   notify(type==='experiment'?'An experiment is taking shape.':'Your new draft is ready.');
   await goto(type==='experiment'?`/experiments/?id=${newId}`:`/documents/?id=${newId}`);
  }catch(e){error=message(e);}
  finally{busy=false;}
 }
</script>

<dialog bind:this={dialog} class="modal" on:close={close} on:cancel={(event)=>{if(busy)event.preventDefault();else close();}}>
 <form on:submit|preventDefault={create}>
  <div class="row between">
   <span class="eyebrow">MAKE SOME SPACE</span>
   <button type="button" class="icon-button" aria-label="Close" on:click={close} disabled={busy}><Icon name="close"/></button>
  </div>
  <h2>What’s got your attention?</h2>
  <p>You don’t need a complete plan. Start with a name and let it take shape.</p>
  <label for="new-type">Start with
   <select id="new-type" bind:value={type} disabled={busy}>
    <option value="experiment">An experiment</option><option value="interest">An interest</option>
    <option value="idea">An idea</option><option value="story">A story</option>
   </select>
  </label>
  <label for="new-title">Give it a name
   <input id="new-title" bind:value={title} required maxlength="180" placeholder="A question, a topic, a possibility…" disabled={busy}/>
  </label>
  <TagEditor bind:tags disabled={busy}/>
  {#if type==='experiment'}
   <label for="new-source">What inspired this experiment?
    <select id="new-source" bind:value={sourceId} disabled={busy}>
     <option value="">Start fresh</option>
     {#if contextualSource?.document_id&&!choices.some(doc=>doc.revision.document_id===contextualSource?.document_id)}
      <option value={contextualSource.document_id}>{contextualSource.title||'This Heron document'}</option>
     {/if}
     {#each choices as doc (doc.revision.document_id)}
      <option value={doc.revision.document_id}>{doc.title} · {doc.doc_type==='act'?'action':doc.doc_type.replaceAll('_',' ')}</option>
     {/each}
     <option value="url">A URL</option>
    </select>
   </label>
   {#if sourceId==='url'}
    <label for="new-source-url">Source URL
     <input id="new-source-url" type="url" bind:value={sourceUrl} placeholder="https://example.org/" required disabled={busy}/>
    </label>
   {/if}
  {/if}
  <p class="fine privacy-line"><Icon name="lock" size={14}/> This starts as a private draft.</p>
  {#if error}<p class="alert" role="alert">{error}</p>{/if}
  <button class="button primary full" disabled={busy}>
   {busy?'Creating…':'Create '+((['idea','interest','experiment'].includes(type)?'an ':'a ')+type)}<Icon name="arrow" size={17}/>
  </button>
 </form>
</dialog>
