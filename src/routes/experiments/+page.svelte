<script lang="ts">
 import {raftSteps as steps,isMapCopy} from '$lib/raft-flow.mjs';
 import BuddyInvitation from '$lib/BuddyInvitation.svelte';
 import MapSubmission from '$lib/MapSubmission.svelte';
 import {locationsFor} from '$lib/experiment-locations';
 import type {Draft} from '$lib/types';
 import SharePanel from '$lib/SharePanel.svelte';import InvitationManager from '$lib/InvitationManager.svelte';
 import {page} from '$app/stores';import {documents,loadingDocuments,openCreate,dirtyEditor} from '$lib/workspace';import {stepDocument,experimentDocuments} from '$lib/journey.mjs';import DraftEditor from '$lib/DraftEditor.svelte';import WorkPanel from '$lib/WorkPanel.svelte';import ExperimentCard from '$lib/ExperimentCard.svelte';import Icon from '$lib/Icon.svelte';
 let actions:Draft[]=[];
 let invitationMode='invite';
 function chooseInvitationMode(event:Event){const select=event.currentTarget as HTMLSelectElement;if($dirtyEditor&&!confirm('Switch sharing options with unsaved invitation notes? A recovery copy will stay on this device.')){select.value=invitationMode;return;}invitationMode=select.value;}

 $: id=$page.url.searchParams.get('id')||'';
 $: parent=$documents.find(d=>d.revision.document_id===id&&d.doc_type==='experiment');
 $: selected=steps.find(s=>s.key===($page.url.searchParams.get('step')==='participation'?'invitation':$page.url.searchParams.get('step')))||steps[0];
 $: index=steps.indexOf(selected);
 $: interest=parent?stepDocument(parent,$documents,steps[0]):null;
 $: focus=parent?stepDocument(parent,$documents,steps[2]):null;
 $: story=parent?stepDocument(parent,$documents,steps[8]):null;
 $: sharing=$page.url.searchParams.get('share')==='1';
 $: actions=parent?experimentDocuments(parent,$documents).filter((doc:Draft)=>doc.doc_type==='action')
  .sort((a:Draft,b:Draft)=>a.revision.document_id.localeCompare(b.revision.document_id)):[];
 $: brainDump=parent?experimentDocuments(parent,$documents).find((doc:Draft)=>doc.doc_type==='brain_dump'):null;
 $: earlierParticipation=parent?experimentDocuments(parent,$documents).find((doc:Draft)=>doc.doc_type==='participation'):null;
 $: actionId=$page.url.searchParams.get('action');
 $: action=actionId==='new'?undefined:actions.find(doc=>doc.revision.document_id===actionId)??actions[0];
 $: locationStages=parent?experimentDocuments(parent,$documents).filter((stage:Draft)=>['exploration','action','story'].includes(stage.doc_type)) as Draft[]:[];
 $: mapLocations=locationStages.flatMap(locationsFor);
 $: child=selected.key==='action'?action:parent?stepDocument(parent,$documents,selected):null;
 $: actionSlot=selected.key==='action'?(action?.revision.document_id??(actionId==='new'?'new':'')):'';
</script>
{#if !id}<div class="page-heading"><span class="eyebrow">YOUR EXPERIMENTS</span><h1>Small things, worth trying.</h1></div><div class="experiment-grid">{#each $documents.filter(d=>d.doc_type==='experiment'&&!isMapCopy(d)) as experiment,index}<ExperimentCard {experiment} {index}/>{:else}<button class="button primary" on:click={()=>openCreate()}>Start an experiment</button>{/each}</div>
{:else if $loadingDocuments}<div class="loading-panel">Opening your experiment…</div>
{:else if parent}<div class="journey-layout"><aside class="journey-nav"><div class="journey-nav-heading">YOUR JOURNEY<span>At your own pace</span></div><nav aria-label="Experiment journey">{#each steps as step,i}<a href={`/experiments/?id=${id}&step=${step.key}`} class:active={selected.key===step.key} aria-current={selected.key===step.key?'step':undefined}><span class:saved={!!stepDocument(parent,$documents,step)} class="step-number">{#if stepDocument(parent,$documents,step)}<Icon name="check" size={13}/>{:else}{String(i+1).padStart(2,'0')}{/if}</span><span>{step.short}</span></a>{/each}</nav><div class="journey-nav-note"><Icon name="lock" size={15}/><span>Each step has its own private notes. A saved note doesn’t mean the work is finished.</span></div></aside><div class="journey-editor">{#if sharing}
  <div class="step-heading"><h2>Invite or share</h2></div>
  <div class="panel">
   <label for="invitation-purpose">Sharing options
    <select id="invitation-purpose" value={invitationMode} on:change={chooseInvitationMode}>
     <option value="invite">Manage invitations &amp; role groups</option>
     <option value="story">Share experiment story &amp; impact</option>
    </select>
   </label>
   {#key id}
    {#if invitationMode==='story'}<SharePanel document={parent} expanded/>
    {:else}<InvitationManager experiment={parent}/>{/if}
   {/key}
  </div>
 {:else}
  <div class="step-heading">
   <span class="eyebrow">STEP {index+1} OF {steps.length}</span>
   <h2>{selected.label}</h2>
   <p>{selected.intro}</p>
   {#if index===0}<a class="text-link" href={`/documents/?id=${id}`}>Edit experiment details and tags</a>{/if}
  </div>
  {#if interest?.body_md?.trim()&&['brain_dump','experiment_start'].includes(selected.key)}
   <details class="legacy-notebook"><summary>View statement of interest</summary><div class="action-brain-dump">{interest.body_md}</div></details>
  {/if}
  {#if focus&&['exploration','meeting_plan','action','reflection','story'].includes(selected.key)}
   <details class="legacy-notebook"><summary>View weekly focus</summary>
    {#each focus.meta?.sprint?.jobs??[] as job}<p>{job}</p>{/each}
    <div class="action-brain-dump">{focus.body_md}</div>
   </details>
  {/if}
  {#if selected.key==='invitation'}
   {#key id}<BuddyInvitation experiment={parent}/>{/key}
  {/if}
  {#if selected.key==='invitation'&&earlierParticipation}
   <details class="legacy-notebook"><summary>Earlier buddy arrangement</summary>
    {#if earlierParticipation.meta?.participation?.mode}<p>{earlierParticipation.meta.participation.mode==='solo'?'On my own':'With a buddy'}</p>{/if}
    {#if earlierParticipation.meta?.participation?.name}<p>{earlierParticipation.meta.participation.name}</p>{/if}
    <div class="action-brain-dump">{earlierParticipation.body_md}</div>
   </details>
  {/if}
  {#if selected.key==='action'}
   <nav class="row wrap" aria-label="Actions">
    {#each actions as item (item.revision.document_id)}
     <a class="button small" class:primary={action===item} aria-current={action===item?'true':undefined}
      href={`?id=${id}&step=action&action=${item.revision.document_id}`}>{item.title}</a>
    {/each}
    {#if actions.length&&actionId!=='new'}
     <a class="button small" href={`?id=${id}&step=action&action=new`}>New action</a>
    {/if}
   </nav>
   <details class="legacy-notebook">
    <summary>View brain dump</summary>
    {#if brainDump?.body_md?.trim()}
     <p class="fine">Use these notes to name an action or add tasks below.</p>
     <div class="readable-markdown action-brain-dump">{brainDump.body_md}</div>
    {:else}
     <p class="fine">Your saved brain dump will appear here.</p>
     <a class="text-link" href={`?id=${id}&step=brain_dump`}>Open brain dump</a>
    {/if}
   </details>
  {/if}
  {#if selected.key==='submission'}
   {#key id}<MapSubmission {parent} {story} suggestedPlace={locationStages.find(stage=>stage.meta?.workspace_place?.trim())?.meta.workspace_place??''} {mapLocations} reviewNotes={child?.body_md}/>{/key}
  {:else}
  {#key JSON.stringify([id,selected.key,selected.key==='action'?actionSlot:''])}
   <DraftEditor documentId={child?.revision.document_id} {parent} step={selected} {actionSlot} brainstorm={brainDump?.body_md} locationStages={locationStages.filter(stage=>stage.revision.document_id!==child?.revision.document_id)}/>
  {/key}
  {/if}
 <div class="step-navigation">{#if index>0}<a class="text-link" href={`/experiments/?id=${id}&step=${steps[index-1].key}`}>← {steps[index-1].short}</a>{:else}<span></span>{/if}{#if index<steps.length-1}<a class="text-link" href={`/experiments/?id=${id}&step=${steps[index+1].key}`}>{steps[index+1].short}<Icon name="arrow" size={16}/></a>{/if}</div><details class="legacy-notebook"><summary>Work log</summary><WorkPanel {parent}/></details>{#if parent.meta?.journey_version&&parent.details}<details class="legacy-notebook"><summary>Your earlier workspace notes</summary><p class="fine">These notes are preserved from the earlier journey. They’re included in your private export.</p><pre class="readable-markdown">{parent.details}</pre></details>{/if}{/if}</div></div>
{:else}<div class="empty-card"><h2>This experiment isn’t in your workspace.</h2><p>It may have been removed, or belong to another account.</p><a class="button primary" href="/">Back to my workspace</a></div>{/if}
