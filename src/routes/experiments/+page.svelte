<script lang="ts">
 import {page} from '$app/stores';
 import {isMapCopy} from '$lib/raft-flow.mjs';
 import {documents, loadingDocuments, openCreate, dirtyEditor} from '$lib/workspace';
 import {experimentDocuments} from '$lib/journey.mjs';
 import ExperimentCard from '$lib/ExperimentCard.svelte';
 import ExperimentWorkflow from '$lib/ExperimentWorkflow.svelte';
 import ReadOnlyDraft from '$lib/ReadOnlyDraft.svelte';
 import SharePanel from '$lib/SharePanel.svelte';
 import InvitationManager from '$lib/InvitationManager.svelte';
 import type {Draft} from '$lib/types';

 let invitationMode='invite';
 function chooseInvitationMode(event:Event){
  const select=event.currentTarget as HTMLSelectElement;
  if($dirtyEditor&&!confirm('Switch sharing options with unsaved invitation notes?')){
   select.value=invitationMode;
   return;
  }
  invitationMode=select.value;
 }
 $: id=$page.url.searchParams.get('id')||'';
 $: parent=$documents.find(draft=>draft.revision.document_id===id&&draft.doc_type==='experiment');
 $: children=parent?experimentDocuments(parent,$documents) as Draft[]:[];
 $: sharing=$page.url.searchParams.get('share')==='1';
</script>

{#if !id}
 <div class="page-heading"><h1>Your experiments</h1></div>
 <div class="experiment-grid">
  {#each $documents.filter(draft=>draft.doc_type==='experiment'&&!isMapCopy(draft)) as experiment,index}
   <ExperimentCard {experiment} {index}/>
  {:else}
   <button class="button primary" on:click={()=>openCreate()}>Start an experiment</button>
  {/each}
 </div>
{:else if $loadingDocuments&&!parent}
 <div class="loading-panel">Opening your experiment…</div>
{:else if parent}
 {#key id}
  {#if parent.meta?.workflow_version!==2}
   <section aria-label="Earlier experiment">
    <h2>Earlier experiment</h2>
    <p>This experiment and its saved drafts are read-only.</p>
    {#each [parent,...children] as draft (draft.revision.document_id)}
     <details class="legacy-notebook" id={'draft-'+draft.revision.document_id}
      open={draft===parent||$page.url.searchParams.get('draft')===draft.revision.document_id}>
      <summary>{draft.title} · {draft.doc_type.replaceAll('_',' ')}</summary>
      <ReadOnlyDraft {draft}/>
     </details>
    {/each}
   </section>
  {:else if sharing}
   <div class="step-heading"><h2>Invite or share</h2></div>
   <div class="panel">
    <label>Sharing options
     <select value={invitationMode} on:change={chooseInvitationMode}>
      <option value="invite">Manage invitations &amp; role groups</option>
      <option value="story">Share experiment story &amp; impact</option>
     </select>
    </label>
    {#if invitationMode==='story'}<SharePanel document={parent} expanded/>
    {:else}<InvitationManager experiment={parent}/>{/if}
   </div>
  {:else}
   <ExperimentWorkflow {parent} {children}/>
  {/if}
 {/key}
{:else}
 <div class="empty-card"><h2>This experiment isn’t in your workspace.</h2>
  <a class="button primary" href="/">Back to my workspace</a>
 </div>
{/if}
