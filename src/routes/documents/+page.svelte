<script lang="ts">
 import {page} from '$app/stores';import {documents,loadingDocuments,openCreate} from '$lib/workspace';import DraftEditor from '$lib/DraftEditor.svelte';import Icon from '$lib/Icon.svelte';import {labels} from '$lib/journey.mjs';
 import {documentUrl,experimentParent} from '$lib/document-links.mjs';
 import {linksTo} from '$lib/journey.mjs';
 import {isMapCopy} from '$lib/raft-flow.mjs';
 import ReadOnlyDraft from '$lib/ReadOnlyDraft.svelte';
 $: id=$page.url.searchParams.get('id')||'';$: doc=$documents.find(d=>d.revision.document_id===id);
 $: linkedExperiments=doc?.doc_type==='idea'?$documents.filter(candidate=>
  candidate.doc_type==='experiment'&&!isMapCopy(candidate)&&linksTo(candidate,id,['grew_from'])):[];
 $: parent=doc?experimentParent(doc,$documents):undefined;
 $: target=parent?documentUrl(id,$documents):null;
 $: workflowDoc=!!parent&&['experiment','spark','focus','brainstorm','act','story'].includes(doc?.doc_type??'');
</script>
{#if doc && parent && (parent.meta?.workflow_version!==2||workflowDoc)}
 <a class="back-link" href={target||'/experiments/'}>← Open experiment</a>
 <div class="panel"><h2>{doc.title}</h2><ReadOnlyDraft draft={doc}/></div>
{:else if id&&!doc&&$loadingDocuments}
 <div class="loading-panel">Opening your draft…</div>
{:else}
 <a class="back-link" href="/library/">← My library</a><div class="page-heading"><span class="eyebrow">{labels[doc?.doc_type||'']||'YOUR PRIVATE DRAFT'}</span><h1>{doc?.doc_type==='interest'?'Follow what draws you in.':doc?.doc_type==='story'?'There’s a story here.':'A little room to think.'}</h1><p>Your words, your pace. Come back whenever you’re ready.</p></div>{#if doc?.doc_type==='interest'}<div class="inline-callout"><Icon name="leaf" size={20}/><span>This interest could become a small experiment.</span><button class="text-button" on:click={()=>openCreate('experiment',id)}>Build from this<Icon name="arrow" size={16}/></button></div>{/if}{#if doc?.doc_type==='idea'}
 <section class="panel" aria-labelledby="idea-experiments">
  <h2 id="idea-experiments">Experiments from this idea</h2>
  {#if linkedExperiments.length}
   <ul>
    {#each linkedExperiments as experiment (experiment.revision.document_id)}
     <li><a class="text-link" href={documentUrl(experiment.revision.document_id,$documents)}>{experiment.title}</a></li>
    {/each}
   </ul>
  {:else}
   <p class="fine">No experiments are linked to this idea yet.</p>
  {/if}
 </section>
{/if}
{#if id}{#key id}<DraftEditor documentId={id}/>{/key}{:else}<p class="alert">Choose a document from your library.</p>{/if}
{/if}
