<script>
 import Icon from '$lib/Icon.svelte';
 import {collaborations,documents,loadingDocuments,session} from '$lib/workspace';
 import {isMapCopy} from '$lib/raft-flow.mjs';

 const sections = [
  { id:'start', label:'Start', icon:'graph', detail:'' },
  { id:'focus', label:'Focus', icon:'target', detail:'Choose one thing you’d like to explore over the next two weeks.' },
  { id:'spark', label:'Spark', icon:'spark', detail:'Capture the questions and possibilities that have your attention.' },
  { id:'action', label:'Action', icon:'check', detail:'Pick a small action you can try and notice what happens.' },
  { id:'story', label:'Story', icon:'book', detail:'Tell the story of what you tried and what you learned.' },
 ];
 let selected = '';
 let sourceMode = 'workspace', sourceId = '', query = '', type = '', limit = 6;
 let inspirationText = '', inspirationUrl = '';
 const types = ['idea','experiment','story'];
 $: workspaceSources = $documents.filter(doc=>types.includes(doc.doc_type)&&!isMapCopy(doc))
  .map(doc=>({id:doc.revision.document_id,title:doc.title,type:doc.doc_type}));
 $: sources = [...workspaceSources,...$collaborations
  .filter(experiment=>!workspaceSources.some(source=>source.id===experiment.document_id))
  .map(experiment=>({id:experiment.document_id,title:experiment.title,type:'experiment'}))]
  .sort((a,b)=>a.title.localeCompare(b.title));
 $: matches = sources.filter(source=>(!type||type===source.type)
  &&source.title.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
 $: chosen = sources.find(source=>source.id===sourceId);
 $: active = sections.find(section => section.id === selected);
</script>

<svelte:head><title>Start a new Idea · Regenerate Skagit</title></svelte:head>

<section class="idea-start" aria-labelledby="idea-start-title">
 <a class="back-link" href="/tutorial/">← How to Raft</a>
 <div class="page-heading"><h1 id="idea-start-title">Start a new Idea</h1></div>
 <div class="idea-sections" role="group" aria-label="Idea sections">
  {#each sections as section}
   <button type="button" aria-pressed={selected===section.id} aria-controls="idea-section-preview"
    on:click={()=>selected=section.id}>
    <Icon name={section.icon} size={54}/>
    <span>{section.label}</span>
   </button>
  {/each}
 </div>
 <div id="idea-section-preview" aria-live="polite">
  {#if selected==='start'}
   <section class="panel" aria-labelledby="inspiration-question">
    <h2 id="inspiration-question">What was the inspiration for this idea?</h2>
    <fieldset class="row wrap source-options">
     <legend>Inspiration source</legend>
     <label class="checkbox-label"><input type="radio" name="source-mode" bind:group={sourceMode} value="workspace"/> From your workspace</label>
     <label class="checkbox-label"><input type="radio" name="source-mode" bind:group={sourceMode} value="other"/> Other</label>
    </fieldset>
    {#if sourceMode==='other'}
     <label>What inspired you?<textarea rows="3" bind:value={inspirationText}></textarea></label>
     <label>Inspiration URL<input type="url" placeholder="https://…" bind:value={inspirationUrl}/></label>
    {:else if $session.loading||$loadingDocuments}
     <p role="status">Loading your workspace…</p>
    {:else if !$session.profile?.authenticated}
     <a class="text-link" href="/">Sign in to see your workspace</a>
    {:else}
     <div class="source-filters">
      <label>Search by title<input type="search" bind:value={query} on:input={()=>limit=6}/></label>
      <label>Document type<select bind:value={type} on:change={()=>limit=6}>
       <option value="">All types</option>
       <option value="idea">Ideas</option>
       <option value="experiment">Experiments</option>
       <option value="story">Stories</option>
      </select></label>
     </div>
     {#if chosen}<p role="status">Selected inspiration · <strong>{chosen.title}</strong></p>{/if}
     {#if matches.length}
      <fieldset class="source-list">
       <legend>Choose one</legend>
       {#each matches.slice(0,limit) as source (source.id)}
        <label class="checkbox-label">
         <input type="radio" name="inspiration" bind:group={sourceId} value={source.id}/>
         <span>{source.title} <small>{source.type}</small></span>
        </label>
       {/each}
      </fieldset>
      {#if matches.length>limit}
       <button type="button" class="button secondary" on:click={()=>limit+=6}>Show more ({matches.length-limit})</button>
      {/if}
     {:else}
      <p>No matching ideas, experiments, or stories.</p>
     {/if}
    {/if}
   </section>
  {:else if active}<p class="panel">{active.detail}</p>{/if}
 </div>
</section>

<style>
 .idea-start { max-width: 64rem; margin: 0 auto; padding: 1.5rem; }
 .idea-sections { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: .75rem; }
 .idea-sections button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: .75rem;
  min-height: 9rem;
  padding: 1rem;
  border: 1px solid var(--line);
  border-radius: .9rem;
  background: #f7f8ef;
  color: #38503a;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
 }
 .idea-sections button:hover, .idea-sections button[aria-pressed='true'] { background: #e7eddb; border-color: #829677; }
 .idea-sections button:focus-visible { outline: 2px solid #38503a; outline-offset: 3px; }
 #idea-section-preview { margin-top: 1rem; }
 .source-options, .source-filters, .source-list { margin-block: .75rem; }
 .source-filters { display: grid; gap: .75rem; grid-template-columns: 2fr 1fr; }
 .source-list label { margin-block: .35rem; overflow-wrap: anywhere; }
 .source-list small { color: #526650; text-transform: capitalize; }
 @media (max-width: 480px) {
  .source-filters { grid-template-columns: 1fr; }
 }
 @media (max-width: 850px) {
  .idea-sections { grid-template-columns: repeat(3, minmax(0, 1fr)); }
 }
 @media (max-width: 480px) {
  .idea-sections { grid-template-columns: repeat(2, minmax(0, 1fr)); }
 }
</style>
