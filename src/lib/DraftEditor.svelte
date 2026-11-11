<script lang="ts">
 import {raftSteps as steps,brainstormJobs,defaultSprint,storyPrompts} from './raft-flow.mjs';
 import TagEditor from './TagEditor.svelte';
 import ActionChecklist from './ActionChecklist.svelte';
 import ExperimentLocations from './ExperimentLocations.svelte';
 import {validLocation,type ExperimentLocation} from './experiment-locations';
 import {onMount,onDestroy,tick} from 'svelte';import {beforeNavigate,goto} from '$app/navigation';import Icon from './Icon.svelte';
 import {documents,openCreate,api,ApiError,loadDocument,saveDocument,message,notify,readRecovery,writeRecovery,clearRecovery,upsert,dirtyEditor} from './workspace';
 import type {Draft,DraftPayload,Revision} from './types';import {sameContent,explicitTags,draftTags} from './content.mjs';
 export let documentId:string|undefined=undefined;export let parent:Draft|null=null;export let step:any=null;
 export let actionSlot='';
 export let brainstorm:string|undefined=undefined;
 export let locationStages:Draft[]=[];
 const suggestedSprint=defaultSprint();
 $: sprint=meta.sprint??suggestedSprint;
 $: chosenJobs=(meta.sprint?.jobs??[]) as string[];
 $: availableJobs=[...new Set([...brainstormJobs(brainstorm),...chosenJobs])];
 function selectJob(job:string,checked:boolean){
  meta={...meta,sprint:{...sprint,jobs:checked?[...chosenJobs,job]:chosenJobs.filter(item=>item!==job)}};
 }
 let current:Draft|null=null,id='',recoveryId='',title='',body='',meta:Record<string,any>={},details:string|null=null;
 let tags:string[]=[];
 $: markdownTags=current?draftTags(current).filter(tag=>!explicitTags(current).includes(tag)):[];
 let loading=true,busy=false,error='',baseline='',pending:any=null,conflict:Draft|null=null;
 let history:Revision[]=[],showHistory=false,historical:Draft|null=null,recoveryFailed=false,ready=false;
 $: nextStep=step?steps[steps.findIndex(s=>s.key===step.key)+1]:null;
 $: fingerprint=JSON.stringify({title,body,tags,meta,details});
 $: dirty=ready&&fingerprint!==baseline;
 $: dirtyEditor.set(dirty);
 $: if(ready&&dirty&&!pending){fingerprint;recoveryFailed=!writeRecovery(recoveryId,{document_id:id,payload:payload(),revision_id:current?.revision.revision_id??null,saved_at:new Date().toISOString()});}
 function payload():DraftPayload{const savedMeta=step?.key==='experiment_start'?{...meta,sprint}:meta;return {doc_type:step?.type||current?.doc_type||'idea',title:title.trim()||step?.short||'Untitled draft',body_md:body,tags:JSON.stringify(tags),meta:structuredClone(savedMeta),details,author:current?.author,description:current?.description};}
 function adopt(draft:Draft){current=draft;id=draft.revision.document_id;title=draft.title;body=draft.body_md;tags=explicitTags(draft);meta=structuredClone(draft.meta||{});details=draft.details??null;
  historical=null;conflict=null;
  baseline=JSON.stringify({title,body,tags,meta,details});ready=true;
 }
 async function initialize(){loading=true;error='';try{
  recoveryId=parent&&step?`step:${parent.revision.document_id}:${step.key}`:documentId||id;
  const legacyRecovery=actionSlot&&documentId?readRecovery(recoveryId):null;
  if(actionSlot&&(!legacyRecovery||legacyRecovery.document_id!==documentId))recoveryId+=`:${actionSlot}`;
  const recovery=readRecovery(recoveryId);
  if(documentId)adopt(await loadDocument(documentId));
  else{id=recovery?.document_id||crypto.randomUUID();title=step?.key==='action'?'Action':step?.short||'Untitled draft';meta={workspace_version:1,links:parent?[{relation:'part_of',targets:[{document_id:parent.revision.document_id,title:parent.title}]}]:[]};
   body='';baseline=JSON.stringify({title,body,tags,meta,details});ready=true;
  }
  if(recovery&&(!current||!sameContent(current,recovery.payload)))pending=recovery;else if(recovery)clearRecovery(recoveryId,recovery._storageKey);
 }catch(e){error=message(e);}finally{loading=false;}}
 function recover(){if(!pending)return;const saved=pending;if(writeRecovery(recoveryId,saved))clearRecovery(recoveryId,saved._storageKey);pending=null;title=saved.payload.title;body=saved.payload.body_md;meta=saved.payload.meta;details=saved.payload.details??null;
  if(saved.payload.tags!==undefined)tags=explicitTags({tags:saved.payload.tags});
  if(current&&saved.revision_id!==current.revision.revision_id)conflict=current;
 }
 function discardRecovery(){const source=pending?._storageKey;pending=null;clearRecovery(recoveryId,source);}
 async function save(){if(busy||pending||conflict)return;busy=true;error='';try{
  if((meta.workspace_locations as ExperimentLocation[]|undefined)?.some(location=>!validLocation(location))){
   error='Enter a name, street address, city and state for each location. If you add coordinates, use latitude between −90 and 90 and longitude between −180 and 180.';
   return;
  }
  if(step?.key==='experiment_start'&&sprint.start&&sprint.end&&sprint.end<sprint.start){
   error='Choose an end date on or after the sprint start.';
   return;
  }
  if(JSON.stringify({title,body,tags,meta,details})===baseline&&current)return;
  const creatingAction=step?.key==='action'&&!current;
  const saved=await saveDocument(payload(),current,id);adopt(saved);clearRecovery(recoveryId);pending=null;notify('Saved to your workspace.');
  if(creatingAction&&parent){
   await tick();
   await goto(`/experiments/?id=${parent.revision.document_id}&step=action&action=${id}`,{replaceState:true,keepFocus:true,noScroll:true});
  }
 }catch(e){if(e instanceof ApiError&&e.status===409){try{conflict=await loadDocument(id);}catch{error=message(e);}}else error=message(e);}finally{busy=false;}}
 async function saveMyVersion(){if(!conflict)return;current=conflict;conflict=null;await save();}
 function useSavedVersion(){if(!conflict)return;adopt(conflict);clearRecovery(recoveryId);}
 async function loadHistory(){error='';try{if(!current)return;history=await api.call<Revision[]>('content_history',{id:current.id})??[];showHistory=!showHistory;}catch(e){error=message(e);}}
 async function inspect(revision:Revision){try{historical=await api.call<Draft>('content_revision',{id:current!.id,revision_id:revision.revision_id});}catch(e){error=message(e);}}
 async function restore(){if(!current||!historical||busy)return;if(dirty&&!confirm('Restore this version? Your unsaved edits will be replaced.'))return;busy=true;error='';try{
  const restored=await api.call<Draft>('content_restore',{id:current.id},{revision_id:historical.revision.revision_id,expected_revision_id:current.revision.revision_id});
  if(restored){upsert(restored);adopt(restored);clearRecovery(recoveryId);notify('Restored as a new saved version.');showHistory=false;}
 }catch(e){error=message(e);}finally{busy=false;}}
 function localDate(value:string|undefined){if(!value)return '';const date=new Date(value);return new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,16);}
 function setFeedCoordinate(key:string,value:number,limit:number){
  meta={...meta,feed_location:{...meta.feed_location,[key]:Math.abs(value)<=limit?value:null}};
 }
 function setMeeting(key:string,value:string){meta={...meta,schedule:{...meta.schedule,[key]:value?new Date(value).toISOString():null,timezone:Intl.DateTimeFormat().resolvedOptions().timeZone}};}
 function checkLeave(event:BeforeUnloadEvent){if(dirty){event.preventDefault();event.returnValue='';}}
 onMount(()=>{void initialize();window.addEventListener('beforeunload',checkLeave);});
 onDestroy(()=>{dirtyEditor.set(false);if(typeof window!=='undefined')window.removeEventListener('beforeunload',checkLeave);});
 beforeNavigate(({cancel})=>{if(dirty&&!confirm('You have unsaved edits. Leave this page? A recovery copy will stay on this device.'))cancel();});
</script>
{#if loading}<div class="panel loading-panel">Opening your draft…</div>{:else if !ready}<div class="alert" role="alert">{error}<button class="text-button" on:click={initialize}>Try again</button></div>{:else}
 <div class="editor-panel"><div class="editor-meta row between"><span class="private-badge"><Icon name="lock" size={13}/> Only you</span><button class="text-button subtle" on:click={loadHistory} disabled={!current||busy}><Icon name="history" size={15}/>Saved versions{#if current}<span class="version-number">{current.revision.revision_number}</span>{/if}</button></div>
 {#if pending}<div class="recovery-banner"><strong>There are unsaved edits from this device.</strong><p>Bring them back, or keep the version saved in your workspace.</p><div class="row"><button class="button small" on:click={recover}>Recover my edits</button><button class="text-button" on:click={discardRecovery}>Keep saved version</button></div></div>{/if}
 {#if error}<p class="alert" role="alert">{error}</p>{/if}
 {#if conflict}<div class="conflict-panel" role="alert"><strong>Another version was saved while you were writing.</strong><p>Your edits are still here. Compare them with the saved version before deciding.</p><details><summary>Read the saved version</summary><h3>{conflict.title}</h3><pre class="readable-markdown">{conflict.body_md}</pre></details><div class="row wrap"><button class="button small" on:click={saveMyVersion}>Save my version next</button><button class="text-button" on:click={useSavedVersion}>Use saved version</button></div></div>{/if}
 {#if showHistory}<section class="history-panel"><h3>Saved versions</h3><p class="fine">Restoring a version makes a new save. Earlier work stays in your history.</p><div class="history-list">{#each history as revision}<button class:chosen={historical?.revision.revision_id===revision.revision_id} on:click={()=>inspect(revision)}><span>Version {revision.revision_number}</span><small>{new Date(revision.saved_at.replace(' ','T')+'Z').toLocaleString()}</small></button>{/each}</div>{#if historical}<div class="history-preview"><h4>{historical.title}</h4><pre class="readable-markdown">{historical.body_md||'This version is empty.'}</pre><button class="button small" on:click={restore} disabled={busy||!['draft','changes_requested'].includes(current?.status||'')}>Restore this content</button></div>{/if}</section>{/if}
 <fieldset disabled={busy||!!pending||(!['draft','changes_requested'].includes(current?.status||'draft'))} class="editor-fields">{#if !step||step.key==='action'}<label for="document-title">Title<input id="document-title" class="title-input" bind:value={title} placeholder="Give this a name…"/></label>{/if}
 {#if step?.key==='participation'}<div class="choice-row"><label class:chosen={meta.participation?.mode==='partner'}><input type="radio" name="company" checked={meta.participation?.mode==='partner'} on:change={()=>meta={...meta,participation:{...meta.participation,mode:'partner'}}}/> With a presentation partner</label><label class:chosen={meta.participation?.mode==='solo'}><input type="radio" name="company" checked={meta.participation?.mode==='solo'} on:change={()=>meta={...meta,participation:{mode:'solo'}}}/> On my own</label></div>{#if meta.participation?.mode==='partner'}<label for="partner-name">Partner’s name<input id="partner-name" value={meta.participation?.name||''} on:input={e=>meta={...meta,participation:{...meta.participation,name:e.currentTarget.value}}}/></label><label class="checkbox-label"><input type="checkbox" checked={!!meta.participation?.agreed} on:change={e=>meta={...meta,participation:{...meta.participation,agreed:e.currentTarget.checked}}}/>We have agreed to be presentation partners.</label>{/if}{/if}
 {#if step?.key==='meeting_plan'}<div class="date-grid"><label for="week-one">After week one<input id="week-one" type="datetime-local" value={localDate(meta.schedule?.week_one)} on:input={e=>setMeeting('week_one',e.currentTarget.value)}/><small>Research, preparation, and intentions</small></label><label for="week-two">After week two<input id="week-two" type="datetime-local" value={localDate(meta.schedule?.week_two)} on:input={e=>setMeeting('week_two',e.currentTarget.value)}/><small>Findings, reflection, and celebration</small></label></div><p class="fine">Times are in {Intl.DateTimeFormat().resolvedOptions().timeZone}. Working solo? Set your two personal review dates.</p>{/if}
 {#if step?.key==='experiment_start'}
  <fieldset>
   <legend>Jobs for this sprint</legend>
   {#each availableJobs as job (job)}
    <label class="checkbox-label"><input type="checkbox" checked={chosenJobs.includes(job)} on:change={event=>selectJob(job,event.currentTarget.checked)}/>{job}</label>
   {:else}
    <p class="fine">Add jobs to Brainstorm to select them here.</p>
   {/each}
  </fieldset>
  <div class="date-grid">
   <label>Sprint starts<input type="date" value={sprint.start} on:input={event=>meta={...meta,sprint:{...sprint,start:event.currentTarget.value}}}/></label>
   <label>Sprint ends<input type="date" value={sprint.end} on:input={event=>meta={...meta,sprint:{...sprint,end:event.currentTarget.value}}}/></label>
  </div>
 {/if}
 {#if step?.key==='brain_dump'}
  <ActionChecklist bind:body checklist={false}/>
  {#if brainstormJobs(body).length}
   <ul>{#each brainstormJobs(body) as job}<li>{job}</li>{/each}</ul>
  {/if}
 {/if}
 {#if step?.key==='invitation'}
  <label>How will you work?
   <select value={meta.participation?.mode??''} on:change={event=>meta={...meta,participation:{...meta.participation,mode:event.currentTarget.value}}}>
    <option value="">Decide later</option><option value="solo">On my own</option><option value="partner">With a buddy</option>
   </select>
  </label>
 {/if}
 {#if step?.key==='story'}
  <ol>
   {#each storyPrompts as [question,prompt]}
    <li><strong>{question}</strong><p>{prompt}</p></li>
   {/each}
  </ol>
  {#if !body.trim()}
   <button type="button" class="button small" on:click={()=>body=storyPrompts.map(([question],index)=>`## ${index+1}. ${question}\n\n`).join('\n')}>Add question headings to my draft</button>
  {/if}
 {/if}
 {#if step?.key==='action'}
  <ActionChecklist bind:body/>
  <details>
   <summary>Edit Markdown</summary>
 <label for="document-body">Action Markdown
  <textarea id="document-body" class="markdown-editor" rows="12" bind:value={body}></textarea>
 </label>
  </details>
 {:else if step?.key==='brain_dump'}
  <details open={!!body.trim()&&!brainstormJobs(body).length}>
   <summary>Edit brainstorm Markdown</summary>
   <label for="document-body">Brainstorm notes<textarea id="document-body" rows="8" bind:value={body}></textarea></label>
  </details>
 {:else}
 <label for="document-body">{step?.key==='experiment_start'?'What will finished look like?':step?.key==='story'?'Your story':'Your notes'}
  <textarea id="document-body" class="markdown-editor" rows="12" bind:value={body}></textarea>
 </label>
 {/if}
 {#if ['exploration','action','story'].includes(step?.key)}
  <ExperimentLocations locations={meta.workspace_locations??[]} otherStages={locationStages}
   legacyName={meta.workspace_place??''} update={workspace_locations=>meta={...meta,workspace_locations}}/>
 {/if}
 {#if step?.type==='story'||current?.doc_type==='story'}
  <details>
   <summary>Nearby feed location (optional)</summary>
   <p class="fine">Use approximate coordinates for a public place. If you publish this story as Public in the experiment viewer, people nearby can find it in their feed.</p>
   <div class="date-grid">
    <label>Latitude<input type="number" min="-90" max="90" step="any" value={meta.feed_location?.latitude}
     on:input={e=>setFeedCoordinate('latitude',e.currentTarget.valueAsNumber,90)}/></label>
    <label>Longitude<input type="number" min="-180" max="180" step="any" value={meta.feed_location?.longitude}
     on:input={e=>setFeedCoordinate('longitude',e.currentTarget.valueAsNumber,180)}/></label>
   </div>
  </details>
 {/if}
  <TagEditor bind:tags {markdownTags} disabled={busy||!!pending||!['draft','changes_requested'].includes(current?.status||'draft')}/>
 </fieldset>
 {#if current&&!dirty&&!pending&&!conflict}
 <section class="recovery-banner" aria-label="What’s next" aria-live="polite">
 <strong>Your notes are saved.</strong>
 {#if parent&&nextStep}
 <p>You can keep writing here or move on to {nextStep.short.toLowerCase()}.</p>
 <a class="button primary" href={`/experiments/?id=${parent.revision.document_id}&step=${nextStep.key}`}>Continue to {nextStep.short}<Icon name="arrow" size={16}/></a>
 {:else if !parent&&['idea','interest'].includes(current.doc_type)}
 <p>Turn this into a small experiment. Next, give your thoughts room and choose one piece to explore. Your original notes will stay here.</p>
 <button class="button primary" on:click={()=>openCreate('experiment',current!.revision.document_id)}>Build an experiment from this<Icon name="arrow" size={16}/></button>
 {:else}<p>Come back whenever you’re ready, or explore your other saved work.</p><a class="text-link" href="/library/">Back to my library<Icon name="arrow" size={16}/></a>{/if}
 </section>{/if}
 <div class="editor-bottom"><div><span class="save-status"><span class:unsaved={dirty}></span>{busy?'Saving…':dirty?'Unsaved edits':current?'Saved to your workspace':'A new private draft'}</span>{#if recoveryFailed}<small class="warning">Local recovery isn’t available. Save before leaving.</small>{:else if dirty}<small>Recovery copy kept on this device</small>{/if}</div><div class="row"><button class="button primary" on:click={save} disabled={busy||!!pending||!!conflict||(!dirty&&!!current)}>{busy?'Saving…':step?.key==='action'?'Save action':'Save my notes'}<Icon name="check" size={16}/></button></div></div></div>
{/if}
