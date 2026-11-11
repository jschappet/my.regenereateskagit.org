<script lang="ts">
 import {api,ApiError,documents,loadDocument,message,saveDocument,upsert} from './workspace';
 import type {ExperimentLocation} from './experiment-locations';
 import type {Draft} from './types';
 import {mapKey,publicStory} from './raft-flow.mjs';

 export let parent:Draft;
 export let story:Draft|null;
 export let suggestedPlace='';
 export let mapLocations:ExperimentLocation[]=[];
 export let reviewNotes:string|undefined=undefined;

 const experimentKey=mapKey(parent.revision.document_id);
 const existing=$documents.find(doc=>doc.meta?.experiment_id===experimentKey);
 const sections=publicStory(story?.body_md??'');
 let exploration=sections.exploration||existing?.meta?.story_exploration||'';
 let happened=sections.happened||existing?.meta?.story_happened||'';
 let takeaway=sections.takeaway||existing?.meta?.story_takeaway||'';
 let location:string=existing?.meta?.location??'';
 let latitude:number|undefined=existing?.meta?.latitude;
 let longitude:number|undefined=existing?.meta?.longitude;
 let busy=false,error='';
 $: publication=$documents.find(doc=>doc.meta?.experiment_id===experimentKey);
 $: editable=!publication||['draft','changes_requested'].includes(publication.status);

 function chooseLocation(id:string){
  const chosen=mapLocations.find(item=>item.id===id);
  if(!chosen)return;
  location=chosen.name;
  latitude=chosen.latitude??undefined;
  longitude=chosen.longitude??undefined;
 }

 async function submit(){
  if(busy||!editable||!story?.body_md.trim())return;
  if(latitude==null||longitude==null||Math.abs(latitude)>90||Math.abs(longitude)>180)return;
  if(![exploration,happened,takeaway,location].every(value=>value.trim()))return;
  busy=true;
  error='';
  try{
   await api.call('experiment_workspace_ready');
   const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(experimentKey));
   const bytes=new Uint8Array(hash).slice(0,16);
   bytes[6]=(bytes[6]&15)|80;
   bytes[8]=(bytes[8]&63)|128;
   const hex=Array.from(bytes,byte=>byte.toString(16).padStart(2,'0')).join('');
   const id=[hex.slice(0,8),hex.slice(8,12),hex.slice(12,16),hex.slice(16,20),hex.slice(20)].join('-');
   const meta={
    journey_version:1,experiment_id:experimentKey,experiment_status:'completed',
    story_exploration:exploration.trim(),story_happened:happened.trim(),story_takeaway:takeaway.trim(),
    location:location.trim(),latitude,longitude,
   };
   let draft:Draft;
   try{
    draft=await saveDocument({doc_type:'experiment',title:parent.title,body_md:'',meta},publication??null,id);
   }catch(error){
    if(!(error instanceof ApiError)||error.status!==409)throw error;
    await loadDocument(id);
    throw new Error('A map submission already exists. Review its status before trying again.');
   }
   const submitted=await api.call<Draft>('content_submit',{id:draft.id},{});
   if(submitted)upsert(submitted);
   else await loadDocument(draft.revision.document_id);
  }catch(reason){
   error=message(reason);
  }finally{busy=false;}
 }
</script>

{#if reviewNotes?.trim()}
 <details class="legacy-notebook"><summary>Earlier review notes</summary><div class="action-brain-dump">{reviewNotes}</div></details>
{/if}
{#if error}<p class="alert" role="alert">{error}</p>{/if}
{#if !editable}
 <p>Story status: {publication?.status}. It appears on the map after approval and publication.</p>
{:else if !story?.body_md.trim()}
 <p>Save your story before submitting it to the map.</p>
{:else}
 <form class="editor-panel" on:submit|preventDefault={submit}>
  <fieldset class="editor-fields" disabled={busy}>
   <p>Review the public copy of your story and choose one location you’re comfortable sharing.</p>
   <label>What drew you in?<textarea bind:value={exploration} rows="3" required></textarea></label>
   <label>What happened?<textarea bind:value={happened} rows="5" required></textarea></label>
   <label>What are you taking away?<textarea bind:value={takeaway} rows="3" required></textarea></label>
   {#if mapLocations.length}
    <label>Use a saved location
     <select on:change={event=>chooseLocation(event.currentTarget.value)}>
      <option value="">Choose a location</option>
      {#each mapLocations as item}
       <option value={item.id}>{item.name} · {item.address}, {item.city}, {item.state}</option>
      {/each}
     </select>
    </label>
   {/if}
   <label>Public location name<input bind:value={location} required/></label>
   {#if suggestedPlace&&!location}
    <p><button type="button" class="text-button" on:click={()=>location=suggestedPlace}>Use {suggestedPlace}</button></p>
   {/if}
   <p class="fine">Use coordinates for a place you’re comfortable making public. An approximate location is fine. You can skip map submission if there’s no suitable place.</p>
   <div class="date-grid">
    <label>Latitude<input type="number" min="-90" max="90" step="any" bind:value={latitude} required/></label>
    <label>Longitude<input type="number" min="-180" max="180" step="any" bind:value={longitude} required/></label>
   </div>
   <button class="button primary">{busy?'Submitting…':'Submit story for review'}</button>
  </fieldset>
 </form>
{/if}
<a class="text-link" href="https://regenerateskagit.org/experiments/map/">View the public experiment map</a>
