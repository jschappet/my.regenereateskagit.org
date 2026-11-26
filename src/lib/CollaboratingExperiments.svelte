<script lang="ts">
 import {collaborations} from './workspace';
</script>

{#if $collaborations.length}
 <section aria-labelledby="collaborating-experiments">
  <div class="section-heading"><h2 id="collaborating-experiments">Experiments you collaborate on</h2></div>
  <div class="experiment-grid">
   {#each $collaborations as experiment (experiment.document_id)}
    <a class="experiment-card" href={'/view/?id='+encodeURIComponent(experiment.document_id)}>
     <span class="stage">Collaborator</span>
     <h3>{experiment.title}</h3>
     <span class="text-link">Open experiment</span>
    </a>
   {/each}
  </div>
 </section>
{/if}
