<script lang="ts">
 import TagEditor from './TagEditor.svelte';
 let tags:string[]=[];
 import {goto} from '$app/navigation';import {createDialog,documents,saveDocument,message,notify} from './workspace';import Icon from './Icon.svelte';
 let dialog:HTMLDialogElement;let newId='';let title='',type='experiment',interestId='',busy=false,error='';let wasOpen=false;
 $: if($createDialog.open&&!wasOpen){wasOpen=true;newId=crypto.randomUUID();type=$createDialog.type;interestId=$createDialog.interestId||'';tags=[];title=$documents.find(d=>d.revision.document_id===interestId)?.title||'';error='';dialog?.showModal();}
 $: if(!$createDialog.open&&wasOpen){wasOpen=false;dialog?.close();}
 function close(){if(!busy)createDialog.set({open:false,type:'experiment'});}
 async function create(){busy=true;error='';try{
  const interest=$documents.find(d=>d.revision.document_id===interestId);const id=newId;
  const meta={workspace_version:1,links:type==='experiment'&&interest?[{relation:'grew_from',targets:[{document_id:interest.revision.document_id,title:interest.title}]}]:[]};
  await saveDocument({doc_type:type,title:title.trim(),body_md:'',tags:JSON.stringify(tags),meta},null,id);
  createDialog.set({open:false,type});notify(type==='experiment'?'An experiment is taking shape.':'Your new draft is ready.');
  await goto(type==='experiment'?`/experiments/?id=${id}`:`/documents/?id=${id}`);
 }catch(e){error=message(e);}finally{busy=false;}}
</script>
<dialog bind:this={dialog} class="modal" on:close={close} on:cancel={(e)=>{if(busy)e.preventDefault();else close();}}><form on:submit|preventDefault={create}><div class="row between"><span class="eyebrow">MAKE SOME SPACE</span><button type="button" class="icon-button" aria-label="Close" on:click={close} disabled={busy}><Icon name="close"/></button></div><h2>What’s got your attention?</h2><p>You don’t need a complete plan. Start with a name and let it take shape.</p><label for="new-type">Start with<select id="new-type" bind:value={type}><option value="experiment">An experiment</option><option value="interest">An interest</option><option value="idea">An idea</option><option value="story">A story</option></select></label><label for="new-title">Give it a name<input id="new-title" bind:value={title} required maxlength="180" placeholder="A question, a topic, a possibility…"/></label><TagEditor bind:tags disabled={busy}/>{#if type==='experiment'&&$documents.some(d=>['interest','idea'].includes(d.doc_type))}<label for="new-interest">Grow from an existing interest<select id="new-interest" bind:value={interestId}><option value="">Start fresh</option>{#each $documents.filter(d=>['interest','idea'].includes(d.doc_type)) as interest}<option value={interest.revision.document_id}>{interest.title}</option>{/each}</select></label>{/if}<p class="fine privacy-line"><Icon name="lock" size={14}/> This starts as a private draft.</p>{#if error}<p class="alert" role="alert">{error}</p>{/if}<button class="button primary full" disabled={busy}>{busy?'Creating…':'Create '+((['idea','interest','experiment'].includes(type)?'an ':'a ')+type)}<Icon name="arrow" size={17}/></button></form></dialog>
