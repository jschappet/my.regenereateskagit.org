<script lang="ts">
 import SharePanel from '$lib/SharePanel.svelte';import InvitationManager from '$lib/InvitationManager.svelte';
 import {page} from '$app/stores';import {documents,loadingDocuments,openCreate,dirtyEditor} from '$lib/workspace';import {steps,stepDocument} from '$lib/journey.mjs';import DraftEditor from '$lib/DraftEditor.svelte';import WorkPanel from '$lib/WorkPanel.svelte';import ExperimentCard from '$lib/ExperimentCard.svelte';import Icon from '$lib/Icon.svelte';
 let invitationMode='invite';
 function chooseInvitationMode(event:Event){const select=event.currentTarget as HTMLSelectElement;if($dirtyEditor&&!confirm('Switch sharing options with unsaved invitation notes? A recovery copy will stay on this device.')){select.value=invitationMode;return;}invitationMode=select.value;}

 $: id=$page.url.searchParams.get('id')||'';
 $: parent=$documents.find(d=>d.revision.document_id===id&&d.doc_type==='experiment');
 $: selected=steps.find(s=>s.key===$page.url.searchParams.get('step'))||steps[0];
 $: index=steps.indexOf(selected);
 $: sharing=$page.url.searchParams.get('share')==='1';
 $: child=parent?stepDocument(parent,$documents,selected):null;
</script>
{#if !id}<div class="page-heading"><span class="eyebrow">YOUR EXPERIMENTS</span><h1>Small things, worth trying.</h1></div><div class="experiment-grid">{#each $documents.filter(d=>d.doc_type==='experiment') as experiment,index}<ExperimentCard {experiment} {index}/>{:else}<button class="button primary" on:click={()=>openCreate()}>Start an experiment</button>{/each}</div>
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
  </div>
  {#key id+selected.key}<DraftEditor documentId={child?.revision.document_id} {parent} step={selected}/>{/key}
 <div class="step-navigation">{#if index>0}<a class="text-link" href={`/experiments/?id=${id}&step=${steps[index-1].key}`}>← {steps[index-1].short}</a>{:else}<span></span>{/if}{#if index<steps.length-1}<a class="text-link" href={`/experiments/?id=${id}&step=${steps[index+1].key}`}>{steps[index+1].short}<Icon name="arrow" size={16}/></a>{/if}</div><details class="legacy-notebook"><summary>Work log</summary><WorkPanel {parent}/></details>{#if parent.meta?.journey_version&&parent.details}<details class="legacy-notebook"><summary>Your earlier workspace notes</summary><p class="fine">These notes are preserved from the earlier journey. They’re included in your private export.</p><pre class="readable-markdown">{parent.details}</pre></details>{/if}{/if}</div></div>
{:else}<div class="empty-card"><h2>This experiment isn’t in your workspace.</h2><p>It may have been removed, or belong to another account.</p><a class="button primary" href="/">Back to my workspace</a></div>{/if}
