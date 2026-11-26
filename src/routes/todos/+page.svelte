<script lang="ts">
 import {documents,loadingDocuments,session} from '$lib/workspace';
 import {todoActions,todoExperiments} from '$lib/todo-actions';
 import {experimentLineage} from '$lib/experiment-overview.mjs';
 import ActionDialog from '$lib/ActionDialog.svelte';

 let actions:ActionDialog,showCompleted=false;
 $: experiments=todoExperiments($documents,$session.profile?.user?.id);
 $: todos=todoActions(experiments,$documents);
 type Origin={title:string;href?:string|null;children:Origin[]};
 function lineagePaths(origins:Origin[]):Origin[][]{
  return origins.flatMap(origin=>origin.children.length
   ?lineagePaths(origin.children).map(path=>[...path,origin]):[[origin]]);
 }

</script>

<div class="page-heading"><h1>Todo list</h1></div>
<label class="checkbox-label"><input type="checkbox" bind:checked={showCompleted}/> Show completed actions</label>
{#each todos.filter(todo=>showCompleted||!todo.done) as todo (todo.brainstorm.revision.document_id+':'+todo.item.id)}
 {@const paths=lineagePaths(experimentLineage(todo.experiment,$documents).ancestors)}
 <article class="panel todo">
  <h2>{todo.item.title}</h2>
  {#if todo.description}<p>{todo.description}</p>{/if}
  {#if todo.tags.length}<p class="fine">{todo.tags.map(tag=>'#'+tag).join(' · ')}</p>{/if}
  <p class="fine">Expected time · {todo.minutes?(String(todo.minutes).match(/^\d+$/)?todo.minutes+' minutes':todo.minutes):'Unspecified'}</p>
  <nav aria-label="Experiment path">
   {#each paths.length?paths:[[]] as path}
    <div class="row wrap">
     {#each path as origin}
      {#if origin.href}<a class="text-link" href={origin.href}>{origin.title}</a>{:else}<span>{origin.title}</span>{/if}
      <span aria-hidden="true">›</span>
     {/each}
     <a class="text-link" href={'/experiments/?id='+todo.experiment.revision.document_id+'&step=act'}>{todo.experiment.title}</a>
    </div>
   {/each}
  </nav>
  <div class="row wrap">
   {#if todo.done}<span class="fine">Completed</span>
   {:else if todo.experiment.meta?.workflow_version===2}
    <button class="button primary" on:click={()=>actions.open(todo,'complete')}>Complete</button>
   {/if}
   <button class="button" on:click={()=>actions.open(todo,'share')}>Share</button>
   {#if todo.experiment.meta?.workflow_version===2&&experiments.some(experiment=>experiment!==todo.experiment&&experiment.meta?.workflow_version===2)}
    <button class="button" on:click={()=>actions.open(todo,'transfer')}>Move or copy</button>
   {/if}
  </div>
 </article>
{:else}
 <p class="panel">{$loadingDocuments?'Loading your actions…':'No actions to show. Add a small action in an experiment’s Act tab.'}</p>
{/each}

<ActionDialog bind:this={actions}/>

<style>
 .todo { margin-block: 1rem; }
 .todo nav { margin-block: .75rem; }
</style>
