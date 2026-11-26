<script lang="ts">
 import {onMount} from 'svelte';
 import {api,documents,graph,message} from './workspace';
 import {experimentLineage,experimentOverviewStages} from './experiment-overview.mjs';
 import {renderMarkdown} from './markdown.mjs';
 import ExperimentTreeBranch from './ExperimentTreeBranch.svelte';
 import type {Draft} from './types';

 type Response={id:string;kind:string;body:string;name:string;created_at:string};
 export let experiment:Draft;

 let responses:Response[]=[],loading=true,error='';
 const responseLabels:Record<string,string>={feedback:'Feedback',story:'Story',outcome:'Outcome'};
 const id=experiment.revision.document_id;
 $: stages=experimentOverviewStages(experiment,$documents);
 $: lineage=experimentLineage(experiment,$documents,$graph.references);

 async function loadResponses(){
  loading=true;
  error='';
  const [share,invitations]=await Promise.allSettled([
   api.call<{responses:Response[]}>('share_current',{id}),
   api.call<{invitations:{responses:Response[]}[]}>('invitation_definition_list',{id}),
  ]);
  const received=[
   ...(share.status==='fulfilled'?share.value?.responses??[]:[]),
   ...(invitations.status==='fulfilled'?invitations.value?.invitations?.flatMap(invitation=>invitation.responses??[])??[]:[]),
  ];
  responses=[...new Map(received.map(response=>[response.id,response])).values()]
   .sort((first,second)=>second.created_at.localeCompare(first.created_at));
  const failure=[share,invitations].find(result=>result.status==='rejected');
  if(failure?.status==='rejected')error=message(failure.reason);
  loading=false;
 }
 onMount(()=>{void loadResponses();});
</script>

<div class="experiment-overview">
 <section class="panel overview-intro" aria-label="Experiment overview">
  <span class="private-badge">Read-only overview</span>
  <h2>{experiment.title}</h2>
  {#if experiment.description}<p>{experiment.description}</p>{/if}
  {#if experiment.body_md}<div class="invitation-body">{@html renderMarkdown(experiment.body_md)}</div>{/if}
 </section>

 <section class="panel lineage-card" aria-labelledby="lineage-title">
  <h2 id="lineage-title">Experiment tree</h2>
  <div class="lineage">
   <div>
    <h3>Grew from</h3>
    {#if lineage.ancestors.length}<ExperimentTreeBranch branches={lineage.ancestors}/>
    {:else}<p class="fine">No starting point recorded.</p>{/if}
   </div>
   <div class="lineage-current"><span class="fine">This experiment</span><strong>{experiment.title}</strong></div>
   <div>
    <h3>Grew from this</h3>
    {#if lineage.descendants.length}<ExperimentTreeBranch branches={lineage.descendants}/>
    {:else}<p class="fine">No follow-up experiments or ideas yet.</p>{/if}
   </div>
  </div>
 </section>

 <section aria-labelledby="overview-stages">
  <h2 id="overview-stages">Stages</h2>
  <div class="stage-grid">
   {#each stages as stage (stage.type)}
    <article class="panel stage-card" class:story-card={stage.type==='story'}>
     <h3>{stage.label}</h3>
     {#each stage.drafts as draft (draft.revision.document_id)}
      <div class="stage-entry" id={'draft-'+draft.revision.document_id}>
       {#if draft.title!==stage.label}<h4>{draft.title}</h4>{/if}
       {#if draft.description}<p>{draft.description}</p>{/if}
       {#if draft.body_md}<div class="invitation-body">{@html renderMarkdown(draft.body_md)}</div>
       {:else if !draft.description}<p class="fine">No notes saved yet.</p>{/if}
       {#if draft.meta?.workspace_locations?.length}
        <ul class="stage-locations" aria-label="Saved locations">
         {#each draft.meta.workspace_locations as location}
          <li>{[location.name,location.address,location.city,location.state].filter(Boolean).join(' · ')}</li>
         {/each}
        </ul>
       {/if}
      </div>
     {:else}<p class="fine">No notes saved yet.</p>{/each}
    </article>
   {/each}
  </div>
 </section>

 <section aria-labelledby="overview-responses">
  <h2 id="overview-responses">Stories, feedback, and outcomes</h2>
  {#if loading}<p role="status">Loading responses…</p>{/if}
  {#if error}
   <p class="alert" role="alert">Some responses could not load. {error}</p>
   <button type="button" class="button secondary" on:click={loadResponses}>Try again</button>
  {/if}
  <div class="response-grid">
   {#each responses as response (response.id)}
    <article class="panel response-card">
     <h3>{responseLabels[response.kind]||'Response'}</h3>
     <p class="fine">{response.name||'Anonymous visitor'}</p>
     <p class="response-text">{response.body}</p>
    </article>
   {:else}
    {#if !loading&&!error}<div class="panel"><p>No responses received yet.</p></div>{/if}
   {/each}
  </div>
 </section>
</div>

<style>
 .experiment-overview{display:grid;gap:24px;min-width:0}
 .overview-intro,.lineage-card,.stage-card,.response-card{overflow-wrap:anywhere}
 .overview-intro{background:#e7efdf}
 .overview-intro h2{margin:12px 0 0}
 .lineage{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr) minmax(0,1fr);gap:16px;align-items:start}
 .lineage h3{font-size:18px;margin:0}
 .lineage-current{display:grid;gap:4px;background:#e7efdf;border:1px solid #bccbb0;border-radius:8px;padding:14px}
 .stage-grid,.response-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
 .stage-card{border-top:3px solid #91a887}
 .stage-card h3,.response-card h3{margin:0 0 8px}
 .stage-entry+.stage-entry{border-top:1px solid var(--line);margin-top:16px;padding-top:12px}
 .stage-entry h4{margin:8px 0}
 .story-card{grid-column:1/-1;border-top-color:#b28b56}
 .stage-locations{margin:12px 0 0;padding-inline-start:20px}
 .response-card{background:#fbf4e8}
 .response-text{white-space:pre-wrap}
 @media(max-width:650px){.lineage,.stage-grid,.response-grid{grid-template-columns:1fr}}
</style>
