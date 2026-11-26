<script lang="ts">
 import {isMapCopy} from '$lib/raft-flow.mjs';
 import {documents,openCreate} from '$lib/workspace';
 import CollaboratingExperiments from '$lib/CollaboratingExperiments.svelte';
 import ExperimentMap from '$lib/ExperimentMap.svelte';
 import ExperimentCard from '$lib/ExperimentCard.svelte';

 $: experiments=$documents.filter(document=>document.doc_type==='experiment'&&!isMapCopy(document));
</script>

<ExperimentMap {experiments}/>

<div class="section-heading">
 <h1>Your experiments</h1>
 <div class="row wrap">
  <a class="text-link" href="https://regenerateskagit.org/experiments/map/">View the experiment map</a>
  <button class="button secondary" on:click={()=>openCreate('idea')}>New idea</button>
 </div>
</div>
<div class="experiment-grid">
 {#each experiments as experiment,index (experiment.revision.document_id)}
  <ExperimentCard {experiment} {index}/>
 {:else}
  <div class="empty-card">
   <p>What would you like to try?</p>
   <button class="button primary" on:click={()=>openCreate()}>Start an experiment</button>
  </div>
 {/each}
</div>

<CollaboratingExperiments/>
