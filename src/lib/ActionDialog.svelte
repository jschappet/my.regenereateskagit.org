<script lang="ts">
 import {api,documents,message,notify,refreshDocuments,saveDocument,session,stableDocumentId} from './workspace';
 import {todoExperiments,type Todo} from './todo-actions';
 import ShareLinks from './ShareLinks.svelte';

 export let onChange:()=>void=()=>{};
 export let allowCopy=true;
 let dialog:HTMLDialogElement;
 let selected:Todo|null=null;
 let mode:'complete'|'share'|'transfer'='complete';
 let minutes='',story='',destination='',operation='move',error='',url='',inviteBody='',inviteDescription='';
 let inviteId='',copyId='',busy=false;

 $: experiments=todoExperiments($documents,$session.profile?.user?.id);
 $: destinations=experiments.filter(experiment=>experiment.meta?.workflow_version===2&&experiment.revision.document_id!==selected?.experiment.revision.document_id);
 $: invitationTitle=selected?'Try this action · '+selected.item.title.slice(0,155):'';

 export function open(todo:Todo,next:typeof mode){
  selected=todo;mode=next;minutes=String(todo.minutes??'');story='';destination='';operation='move';error='';url='';
  inviteId=crypto.randomUUID();copyId=crypto.randomUUID();
  inviteDescription='Try this action and tell the experiment owner what you noticed.';
  inviteBody='Would you try this action? '+todo.item.title+'\n\nIf you try it, or have tried something like it, please tell me what happened and what you noticed.';
  dialog.showModal();
 }

 async function submit(){
  if(!selected||busy)return;
  const {experiment,brainstorm,item,act}=selected;
  const id=experiment.revision.document_id;
  busy=true;error='';
  try{
   if(mode==='complete'){
    const existing=act?.meta?.plan;
    const plan={selected:true,task:item.description??'',when:'',tracking:'',learning:'',...existing,done:true,duration:minutes,reflection:story.trim()};
    const body=['Completed',...([['task','I will'],['when','When'],['duration','For how long'],['tracking','I’ll keep track by'],
     ['learning','I’m hoping to notice or find out'],['reflection','What I noticed or found out']] as const)
      .filter(([key])=>plan[key]).map(([key,label])=>label+': '+plan[key]+(key==='duration'?' minutes':''))].join('\n\n');
    await saveDocument({doc_type:'act',title:item.title,description:act?.description??item.description,details:act?.details,
     body_md:body,meta:{...(act?.meta??{links:[{relation:'part_of',targets:[{document_id:id}]}]}),brainstorm_item_id:item.id,plan}},
     act??null,act?.revision.document_id??await stableDocumentId('experiment-workflow:'+id+':act:'+item.id));
    notify('Action completed and story saved.');
   }else if(mode==='transfer'){
    await api.call('action_transfer',{}, {source:id,destination,item_id:item.id,
     expected_brainstorm:brainstorm.revision.revision_id,copy_id:operation==='copy'?copyId:null});
    try{await refreshDocuments();}catch{/* The workspace displays the refresh error. */}
    notify(operation==='copy'?'Action copied.':'Action moved.');
   }else{
    const result=await api.call<{url:string}>('invitation_definition_save',{id},{
     document_id:inviteId,expected_revision:null,purpose:'feedback',title:invitationTitle,body:inviteBody,description:inviteDescription,
    });
    if(!result?.url)throw new Error('The server did not return an invitation link.');
    url=result.url;
    return;
   }
   onChange();
   dialog.close();
  }catch(e){error=message(e);}
  finally{busy=false;}
 }
</script>

<dialog class="modal" bind:this={dialog} on:cancel={event=>{if(busy)event.preventDefault();}}>
 {#if selected}
  <form on:submit|preventDefault={submit}>
   <h2>{mode==='complete'?'Complete action':mode==='share'?'Share action':allowCopy?'Move or copy action':'Move action'}</h2>
   <p>{selected.item.title}</p>
   {#if mode==='complete'}
    <label>Time spent (minutes)<input type="number" min="1" max="4294967295" step="1" value={minutes} on:input={event=>minutes=event.currentTarget.value} required disabled={busy}/></label>
    <label>What happened? Tell your story<textarea rows="5" bind:value={story} required disabled={busy}></textarea></label>
   {:else if mode==='transfer'}
    {#if allowCopy}<label>Operation<select bind:value={operation} disabled={busy}><option value="move">Move</option><option value="copy">Copy as a new action</option></select></label>{/if}
    <label>Destination experiment<select bind:value={destination} required disabled={busy}>
     <option value="">{destinations.length?'Choose an experiment':'No other editable experiments'}</option>
     {#each destinations as experiment}<option value={experiment.revision.document_id}>{experiment.title}</option>{/each}
    </select></label>
   {:else if url}
    <p>Anyone with this link can read and respond to the invitation.</p>
    <ShareLinks {url} title={invitationTitle} description={inviteDescription} kind="invitation"/>
   {:else}
    <p>Create a public invitation asking someone to try the action or tell their story.</p>
    <label>Invitation text<textarea bind:value={inviteBody} rows="5" required disabled={busy}></textarea></label>
   {/if}
   {#if error}<p class="alert" role="alert">{error}</p>{/if}
   <div class="row wrap">
    {#if !url}<button class="button primary" disabled={busy||(mode==='complete'&&!story.trim())||(mode==='transfer'&&!destination)}>
     {busy?'Saving…':mode==='complete'?'Save story and complete':mode==='share'?'Create invitation link':operation==='copy'?'Copy action':'Move action'}
    </button>{/if}
    <button type="button" class="button" disabled={busy} on:click={()=>dialog.close()}>{url?'Done':'Cancel'}</button>
   </div>
  </form>
 {/if}
</dialog>
