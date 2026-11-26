<script lang="ts">
 import {onMount} from 'svelte';
 import {api,documents,graph,message} from '$lib/workspace';
 import {documentUrl} from '$lib/document-links.mjs';
 import LedgerGraph from '$lib/LedgerGraph.svelte';
 import {experimentConnections,relationLabel} from '$lib/ledger-graph.mjs';
 import type {Graph} from '$lib/types';

 let loading=true, error='', focus='', graphVersion=0;
 $: connections=experimentConnections($graph,focus);
 $: nodesById=new Map(connections.nodes.map(node=>[node.id,node]));

 async function load(){
  loading=true;
  error='';
  try{
   const result=await api.call<Graph>('content_graph');
   if(!result)throw new Error('The server did not return experiment connections.');
   const {experiments,ideas}=experimentConnections(result);
   if(![...experiments,...ideas].some(node=>node.id===focus))focus='';
   graph.set(result);
  }catch(e){error=message(e);}
  finally{loading=false;}
 }
 onMount(()=>{void load();});

 function nodeUrl(id:string,docs:typeof $documents,invitationId?:string){
  return documentUrl(id,docs) ?? (invitationId ? '/invitations/?id='+encodeURIComponent(invitationId) : null);
 }
</script>

<svelte:head><title>Experiment connections · Regenerate Skagit</title></svelte:head>
<div class="page-heading">
 <h1>Experiment connections</h1>
 <p>Start from an experiment or idea to see what connects to it. Ideas show up to three levels of follow-up experiments.</p>
</div>

{#if error}
 <p class="alert" role="alert">{error}</p>
 <button class="button" on:click={load}>Try again</button>
{:else if loading}
 <p role="status">Loading experiment connections…</p>
{:else if connections.experiments.length||connections.ideas.length}
 <div class="ledger-toolbar">
  <label>Start from
   <select bind:value={focus}>
    <option value="">All experiments and ideas</option>
    {#if connections.experiments.length}
     <optgroup label="Experiments">
      {#each connections.experiments as experiment (experiment.id)}
       <option value={experiment.id}>{experiment.title}</option>
      {/each}
     </optgroup>
    {/if}
    {#if connections.ideas.length}
     <optgroup label="Ideas">
      {#each connections.ideas as idea (idea.id)}
       <option value={idea.id}>{idea.title}</option>
      {/each}
     </optgroup>
    {/if}
   </select>
  </label>
  <button class="button secondary" on:click={()=>graphVersion++}>Reset graph</button>
 </div>
 <div class="panel ledger-stage">
  {#key graphVersion}<LedgerGraph nodes={connections.nodes} links={connections.links}/>{/key}
 </div>
 <p class="fine">Green circles are experiments.{#if $graph.feedback_counts} The number inside a circle is the feedback received for that experiment.{/if} Drag circles to move them, or scroll to zoom.</p>
 <details class="ledger-tables" open>
  <summary>Connections</summary>
  {#if connections.links.length}
   <div class="ledger-table-wrap">
    <table>
     <thead><tr><th scope="col">From</th><th scope="col">Connection</th><th scope="col">To</th></tr></thead>
     <tbody>
      {#each connections.links as link}
       {@const source=nodesById.get(link.source)}
       {@const target=nodesById.get(link.target)}
       {@const sourceUrl=nodeUrl(link.source,$documents,source?.invitation_id)}
       {@const targetUrl=nodeUrl(link.target,$documents,target?.invitation_id)}
       <tr>
        <td>{#if sourceUrl}<a href={sourceUrl}>{source?.title}</a>{:else}{source?.title}{/if}</td>
        <td>{relationLabel(link.relation)}</td>
        <td>{#if targetUrl}<a href={targetUrl}>{target?.title}</a>{:else}{target?.title}{/if}</td>
       </tr>
      {/each}
     </tbody>
    </table>
   </div>
  {:else}
   <p>No connections recorded for this selection yet.</p>
  {/if}
 </details>
{:else}
 <div class="empty-card"><h2>No experiments or ideas yet</h2><a class="button secondary" href="/library/">Visit your library</a></div>
{/if}
