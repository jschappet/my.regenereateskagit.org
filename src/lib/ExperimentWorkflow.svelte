<script lang="ts">
 import {onDestroy,tick} from 'svelte';
 import {beforeNavigate} from '$app/navigation';
 import {page} from '$app/stores';
 import {draftTags, explicitTags, sameContent} from './content.mjs';
 import {dirtyEditor, message, notify, saveDocument, stableDocumentId} from './workspace';
 import {locationsFor, newLocation, validLocation, type ExperimentLocation} from './experiment-locations';
 import MapSubmission from './MapSubmission.svelte';
 import ReadOnlyDraft from './ReadOnlyDraft.svelte';
 import TagEditor from './TagEditor.svelte';
 import type {Draft, DraftPayload} from './types';

 export let parent: Draft;
 export let children: Draft[];

 const tabs = [
  {key:'spark', label:'Spark'}, {key:'focus', label:'Focus'},
  {key:'brainstorm', label:'Brainstorm'}, {key:'act', label:'Act'},
  {key:'story', label:'Story So Far'},
 ] as const;
 type Tab = typeof tabs[number]['key'];
 type Response = {sentence:string; notes:string};
 type Item = {id:string; title:string; removed?:boolean};
 const planFields = [
  ['task','I will'], ['when','When'], ['duration','For how long'],
  ['tracking','I’ll keep track by'], ['learning','I’m hoping to notice or find out'],
 ] as const;
 type Plan = {selected:boolean; done:boolean; reflection:string} & Record<typeof planFields[number][0], string>;
 const prompts = [
  ['What has captivated your attention lately? What draws you in?', 'What draws you in'],
  ["What's something you keep meaning to try?", 'What you’d like to try'],
  ['If you had a free Saturday morning and a friend to help, what would you explore here in Skagit?', 'What you’d explore in Skagit'],
 ];
 const emptyResponse = (): Response => ({sentence:'', notes:''});
 const emptyPlan = (): Plan => ({selected:false,done:false,task:'',when:'',duration:'',tracking:'',learning:'',reflection:''});
 const validMinutes = (value:string) => /^[0-9]+$/.test(value) && Number(value)>0 && Number(value)<=4_294_967_295;
 const planValue = (plan:Plan,key:typeof planFields[number][0]) =>
  key==='duration'&&validMinutes(plan.duration)?plan.duration+' minutes':plan[key].trim();
 const saved = new Map<string,Draft>([['experiment', parent]]);
 for (const draft of children) {
  if (draft.doc_type==='act' && typeof draft.meta?.brainstorm_item_id==='string') {
   saved.set('act:'+draft.meta.brainstorm_item_id,draft);
  } else if (tabs.some(tab=>tab.key===draft.doc_type)) {
   saved.set(draft.doc_type,draft);
  }
 }

 const parentId=parent.revision.document_id;
 let selected:Tab=tabs.find(tab=>tab.key===$page.url.searchParams.get('step'))?.key??'spark';
 let tabButtons:HTMLButtonElement[]=[];
 let tags:string[]=explicitTags(parent);
 let spark:Response[]=prompts.map((_,index)=>({...emptyResponse(),...saved.get('spark')?.meta?.responses?.[index]}));
 let focus:Response={...emptyResponse(),...saved.get('focus')?.meta?.response};
 let items:Item[]=structuredClone(saved.get('brainstorm')?.meta?.items??[]);
 let notes=saved.get('brainstorm')?.meta?.notes??saved.get('brainstorm')?.body_md??'';
 let plans:Record<string,Plan>=Object.fromEntries(items.map(item=>[
  item.id,{...emptyPlan(),...saved.get('act:'+item.id)?.meta?.plan},
 ]));
 let storyEdited=!!saved.get('story') && saved.get('story')?.meta?.generated!==true;
 let storyText=saved.get('story')?.body_md??'';
 let locations:ExperimentLocation[]=saved.has('story')?structuredClone(locationsFor(saved.get('story')!)):[];
 let locationDialog:HTMLDialogElement;
 let locationDraft:ExperimentLocation|undefined;
 let locationError='';
 $: location=locations[0];
 let newItem='', editing='', revisedTitle='', error='', busy=false;

 function storyDraft(focus:Response, items:Item[], plans:Record<string,Plan>){
  const paragraphs=[];
  if(focus.sentence.trim())paragraphs.push('Two-week focus: '+focus.sentence.trim());
  if(focus.notes.trim())paragraphs.push('Focus notes: '+focus.notes.trim());
  for(const item of items){
   const plan=plans[item.id];
   if(!plan || (!plan.done && !plan.selected && !planFields.some(([key])=>plan[key].trim())))continue;
   const label=plan.done?'Action taken':plan.selected&&!item.removed?'Planned action':'Earlier plan';
   const lines=[label+': '+item.title,...planFields
    .filter(([key])=>plan[key].trim())
    .map(([key,label])=>label+': '+planValue(plan,key))];
   if(plan.done&&plan.reflection.trim())lines.push('What I noticed or found out: '+plan.reflection.trim());
   paragraphs.push(lines.join('  \n'));
  }
  return paragraphs.join('\n\n');
 }

 function childPayload(key:string,type:string,title:string,body_md:string,fields:Record<string,unknown>):DraftPayload{
  const current=saved.get(key);
  return {doc_type:type,title,body_md,description:current?.description,details:current?.details,
   meta:{...(current?.meta??{links:[{relation:'part_of',targets:[{document_id:parentId}]}]}),...fields}};
 }
 function responseBody(response:Response){
  return [response.sentence.trim(),response.notes.trim()].filter(Boolean).join('\n\n');
 }
 function payloads(tags:string[],spark:Response[],focus:Response,items:Item[],notes:string,plans:Record<string,Plan>,
   story:string,storyEdited:boolean,locations:ExperimentLocation[]){
  const root=saved.get('experiment')!;
  const brainstormBody=[items.filter(item=>!item.removed).map(item=>'- '+item.title).join('\n'),notes.trim()]
   .filter(Boolean).join('\n\n');
  const payloads=new Map<string,DraftPayload>([
   ['experiment',{doc_type:root.doc_type,title:root.title,body_md:root.body_md,
    description:root.description,details:root.details,meta:root.meta,tags:JSON.stringify(tags)}],
   ['spark',childPayload('spark','spark','Spark',spark.flatMap((response,index)=>
    responseBody(response)?['## '+prompts[index][1]+'\n\n'+responseBody(response)]:[]).join('\n\n'),{responses:spark})],
   ['focus',childPayload('focus','focus','Focus',responseBody(focus),{response:focus})],
   ['brainstorm',childPayload('brainstorm','brainstorm','Brainstorm',brainstormBody,{items,notes})],
  ]);
  for(const item of items){
   const key='act:'+item.id, plan=plans[item.id];
   if(!plan || (!saved.has(key) && samePlan(plan,emptyPlan())))continue;
   const body=[plan.done?'Completed':plan.selected&&!item.removed?'Planned':'Earlier plan',...planFields
    .filter(([key])=>plan[key].trim()).map(([key,label])=>label+': '+planValue(plan,key))];
   if(plan.done&&plan.reflection.trim())body.push('What I noticed or found out: '+plan.reflection.trim());
   payloads.set(key,childPayload(key,'act',item.title,body.join('\n\n'),{brainstorm_item_id:item.id,plan}));
  }
  payloads.set('story',childPayload('story','story','Story So Far',story,{generated:!storyEdited,workspace_locations:locations}));
  return payloads;
 }
 function samePlan(a:Plan,b:Plan){
  return a.selected===b.selected && a.done===b.done && a.reflection===b.reflection
   && planFields.every(([key])=>a[key]===b[key]);
 }

 let baseline=structuredClone(payloads(tags,spark,focus,items,notes,plans,storyEdited?storyText:storyDraft(focus,items,plans),storyEdited,locations));
 $: draftStory=storyDraft(focus,items,plans);
 $: story=storyEdited?storyText:draftStory;
 $: updates=payloads(tags,spark,focus,items,notes,plans,story,storyEdited,locations);
 $: changed=[...updates].filter(([key,payload])=>{
  const previous=baseline.get(key);
  return !previous||!sameContent(previous,payload);
 });
 $: dirty=changed.length>0||!!newItem.trim()||!!editing;
 $: dirtyEditor.set(dirty);
 beforeNavigate(({cancel,willUnload})=>{
  if(busy || (dirty && (willUnload || !confirm('Leave without saving your experiment?'))))cancel();
 });
 onDestroy(()=>dirtyEditor.set(false));

 function chooseTab(key:Tab){selected=key;}
 function tabKey(event:KeyboardEvent,index:number){
  const target={ArrowLeft:(index+tabs.length-1)%tabs.length,ArrowRight:(index+1)%tabs.length,
   Home:0,End:tabs.length-1}[event.key];
  if(target===undefined)return;
  event.preventDefault();
  chooseTab(tabs[target].key);
  tabButtons[target]?.focus();
 }
 function addItem(){
  const title=newItem.trim();
  if(!title)return;
  const id=crypto.randomUUID();
  items=[...items,{id,title}];
  plans={...plans,[id]:emptyPlan()};
  newItem='';
 }
 function renameItem(id:string){
  const title=revisedTitle.trim();
  if(!title)return;
  items=items.map(item=>item.id===id?{...item,title}:item);
  editing='';
 }
 function removeItem(id:string){
  const plan=plans[id];
  items=plan&&!samePlan(plan,emptyPlan()) || saved.has('act:'+id)
   ?items.map(item=>item.id===id?{...item,removed:true}:item)
   :items.filter(item=>item.id!==id);
  if(editing===id)editing='';
 }
 async function openLocation(){
  locationDraft=location?{...location}:newLocation();
  locationError='';
  await tick();
  if(!locationDialog.open)locationDialog.showModal();
 }
 function applyLocation(){
  if(!locationDraft)return;
  const next={...locationDraft,name:locationDraft.name.trim(),address:locationDraft.address.trim(),
   city:locationDraft.city.trim(),state:locationDraft.state.trim()};
  if(!validLocation(next)){
   locationError='Enter a place name, street address, city, and state.';
   return;
  }
  locations=[next,...locations.slice(1)];
  locationDialog.close();
 }
 function clearLocation(){
  locations=locations.slice(1);
  locationDialog.close();
 }
 async function save(){
  if(busy||!changed.length)return;
  error='';
  for(const item of items){
   const plan=plans[item.id];
   const previous=baseline.get('act:'+item.id)?.meta?.plan;
   const completed=plan.done&&!previous?.done;
   const durationChanged=!!plan.duration&&plan.duration!==previous?.duration;
   if((completed||durationChanged)&&!validMinutes(plan.duration)){
    selected='act';
    error='Enter a duration in whole minutes greater than zero for '+item.title+'.';
    return;
   }
  }
  if(locations.some(location=>!validLocation(location))){
   selected='story';
   error='Complete the location name, street address, city, and state, or clear the location.';
   return;
  }
  busy=true;
  let nextBaseline=new Map(baseline);
  try{
   for(const [key,payload] of changed){
    const current=saved.get(key);
    const id=current?.revision.document_id??await stableDocumentId('experiment-workflow:'+parentId+':'+key);
    const result=await saveDocument(payload,current??null,id);
    saved.set(key,result);
    nextBaseline.set(key,structuredClone(payload));
   }
   notify('Experiment saved.');
  }catch(e){error=message(e);}
  finally{baseline=nextBaseline;busy=false;}
 }
 $: sourceIds=new Set((parent.meta?.links??[]).filter(link=>link.relation==='grew_from')
  .flatMap(link=>link.targets.map(target=>target.document_id)));
 $: sources=children.filter(child=>sourceIds.has(child.revision.document_id));
 $: savedStory=children.find(child=>child.doc_type==='story');
 $: activeItems=items.filter(item=>!item.removed);
 $: archivedItems=items.filter(item=>item.removed);
</script>

<div class="workflow">
 <div class="editor">
  <div class="row wrap tabs" role="tablist" aria-label="Experiment stages">
   {#each tabs as tab,index}
    <button type="button" class="button" class:primary={selected===tab.key} role="tab"
     id={'tab-'+tab.key} aria-controls={'panel-'+tab.key} aria-selected={selected===tab.key}
     tabindex={selected===tab.key?0:-1} bind:this={tabButtons[index]}
     on:click={()=>chooseTab(tab.key)} on:keydown={event=>tabKey(event,index)}>{tab.label}</button>
   {/each}
  </div>

  <fieldset class="panel editor-panel" disabled={busy}>
   <div role="tabpanel" id="panel-spark" aria-labelledby="tab-spark" tabindex="0" hidden={selected!=='spark'}>
    <p>Let your attention wander. There are no wrong answers, and a small or odd answer is a good one.</p>
    {#each sources as source (source.revision.document_id)}
     <details class="legacy-notebook"><summary>Starting point · {source.title}</summary><ReadOnlyDraft draft={source}/></details>
    {/each}
    {#each prompts as [prompt],index}
     <fieldset class="group">
      <legend>{index+1}. {prompt}</legend>
      <label>One sentence<input bind:value={spark[index].sentence}/></label>
      <label>Notes<textarea rows="3" bind:value={spark[index].notes}></textarea></label>
     </fieldset>
    {/each}
   </div>

   <div role="tabpanel" id="panel-focus" aria-labelledby="tab-focus" tabindex="0" hidden={selected!=='focus'}>
    <p>Look at what you’ve written so far. What pulls you most for the next two weeks? Choose one interest to explore.</p>
    <fieldset class="group">
     <legend>What would you like to explore over the next two weeks?</legend>
     <label>One sentence<input bind:value={focus.sentence} aria-describedby="focus-helper"/></label>
     <p class="fine" id="focus-helper">If you’re stuck between two, pick the one you’d be a little excited to tell a friend about.</p>
     <label>Notes<textarea rows="3" bind:value={focus.notes}></textarea></label>
    </fieldset>
   </div>

   <div role="tabpanel" id="panel-brainstorm" aria-labelledby="tab-brainstorm" tabindex="0" hidden={selected!=='brainstorm'}>
    <p>Think of small things you might want to do around your interest. Each one should take about 15 minutes. Keep adding to the list. You can come back and edit it any time.</p>
    {#if focus.sentence}<p><strong>Your focus</strong> {focus.sentence}</p>{/if}
    <form on:submit|preventDefault={addItem}>
     <label for="new-small-action">Small action</label>
     <div class="row"><input id="new-small-action" bind:value={newItem} required/><button class="button">Add</button></div>
    </form>
    {#if activeItems.length}
     <ul aria-label="Small actions">
      {#each activeItems as item (item.id)}
       <li>
        {#if editing===item.id}
         <form class="row wrap" on:submit|preventDefault={()=>renameItem(item.id)}>
          <input aria-label="Edit small action" bind:value={revisedTitle} required/>
          <button class="button small">Apply</button>
          <button type="button" class="button small" on:click={()=>editing=''}>Cancel</button>
         </form>
        {:else}
         {item.title}
         <button type="button" class="icon-button" aria-label={'Edit '+item.title} on:click={()=>{editing=item.id;revisedTitle=item.title;}}>✎</button>
         <button type="button" class="icon-button" aria-label={'Remove '+item.title} on:click={()=>removeItem(item.id)}>×</button>
        {/if}
       </li>
      {/each}
     </ul>
    {/if}
    <label>Notes<textarea rows="3" bind:value={notes}></textarea></label>
   </div>

   <div role="tabpanel" id="panel-act" aria-labelledby="tab-act" tabindex="0" hidden={selected!=='act'}>
    <h2>Your Two-Week Experiment</h2>
    <h3>Your Focus</h3>
    <p>{focus.sentence||'Add a two-week interest in Focus.'}</p>
    {#if focus.notes}<p class="notes">{focus.notes}</p>{/if}
    <p>Here’s your brainstorm list. If you want to add, remove, or change anything, go back to the Brainstorm tab. Then check the ones you’ll do this week.</p>
    {#each activeItems as item (item.id)}
     <div class="action">
      <label class="choice"><input type="checkbox" bind:checked={plans[item.id].selected}/>{item.title}</label>
      {#if plans[item.id].selected||plans[item.id].done}
       <fieldset class="group">
        <legend>Plan for {item.title}</legend>
        {#each planFields as [key,label]}
         {#if key==='duration'}
          <label>For how long (minutes)
           <input type="number" min="1" max="4294967295" step="1"
            value={plans[item.id].duration}
            on:input={e=>{plans[item.id].duration=e.currentTarget.value;}}/>
          </label>
          {#if plans[item.id].duration&&!validMinutes(plans[item.id].duration)&&plans[item.id].duration===baseline.get('act:'+item.id)?.meta?.plan?.duration}
           <p class="fine">Earlier duration: {plans[item.id].duration}</p>
          {/if}
         {:else}
          <label>{label}<input bind:value={plans[item.id][key]}/></label>
         {/if}
        {/each}
        <p class="fine">Example: I will sit outside and watch birds on Tuesday and Thursday mornings for 30 minutes total, and take notes on what I see.</p>
        <label class="choice"><input type="checkbox" bind:checked={plans[item.id].done}/>I did this</label>
       </fieldset>
      {/if}
     </div>
    {:else}
     <p>Add a small action in Brainstorm to get started.</p>
    {/each}
    {#if archivedItems.length}
     <details class="group"><summary>Removed actions</summary>
      {#each archivedItems as item (item.id)}
       <div class="action"><h3>{item.title}</h3>
        {#if plans[item.id].done}<p>Completed</p>{/if}
        {#each planFields as [key,label]}
         {#if plans[item.id][key]}<p><strong>{label}</strong> {planValue(plans[item.id],key)}</p>{/if}
        {/each}
       </div>
      {/each}
     </details>
    {/if}
   </div>

   <div role="tabpanel" id="panel-story" aria-labelledby="tab-story" tabindex="0" hidden={selected!=='story'}>
    <h2>Story So Far</h2>
    <p>Review and update the story below. We are most interested in how you conducted this experiment.</p>
    {#each items.filter(item=>plans[item.id].done) as item (item.id)}
     <fieldset class="group">
      <legend>{item.title}</legend>
      {#if plans[item.id].learning.trim()}
       <p>You were hoping to notice or find out: {plans[item.id].learning}</p>
       <label>Did you notice or find out what you were hoping to?
        <textarea rows="3" bind:value={plans[item.id].reflection}></textarea>
       </label>
      {:else}
       <label>What did you notice or find out?
        <textarea rows="3" bind:value={plans[item.id].reflection}></textarea>
       </label>
      {/if}
     </fieldset>
    {/each}
    <div class="row between wrap location-summary">
     <div>
      <strong>Location</strong>
      {#if location}
       <p>{location.name} · {[location.address,location.city,location.state].filter(Boolean).join(', ')}</p>
      {/if}
     </div>
     <button type="button" class="button secondary" aria-haspopup="dialog" on:click={openLocation}>
      {location?'Edit location':'Add location'}
     </button>
    </div>
    <label>Story<textarea rows="14" value={story} on:input={e=>{storyText=e.currentTarget.value;storyEdited=true;}}></textarea></label>
   </div>

   <div class="group">
    <TagEditor bind:tags markdownTags={draftTags(parent).filter(tag=>!explicitTags(parent).includes(tag))} disabled={busy}/>
   </div>
  </fieldset>
  <div class="row wrap save-row">
   <button type="button" class="button primary" disabled={busy||!changed.length||!!editing||!!newItem.trim()} on:click={save}>
    {busy?'Saving…':'Save experiment'}
   </button>
   <span class="fine" role="status">{editing?'Apply or cancel the item edit before saving.':newItem.trim()?'Add the small action before saving.':changed.length?'Unsaved changes':'All changes saved'}</span>
  </div>
  {#if error}<p class="alert" role="alert">{error}</p>{/if}
  {#if selected==='story'&&savedStory}
   <details class="legacy-notebook"><summary>Share a story on the map</summary>
    <MapSubmission {parent} story={savedStory} mapLocations={locationsFor(savedStory)} suggestedPlace={locationsFor(savedStory)[0]?.name??''}/>
   </details>
  {/if}
 </div>

 <aside class="panel build" aria-labelledby="build-heading">
  <h2 id="build-heading">Experiment build</h2>
  {#if !spark.some(response=>responseBody(response))&&!responseBody(focus)&&!activeItems.length&&!notes.trim()}
   <p>Your ideas, focus, and small actions will appear here as you write.</p>
  {/if}
  {#if spark.some(response=>responseBody(response))}
   <h3>Ideas from Spark</h3>
   {#each spark as response,index}
    {#if responseBody(response)}
     <h4>{prompts[index][1]}</h4>
     <p class="notes">{responseBody(response)}</p>
    {/if}
   {/each}
  {/if}
  {#if responseBody(focus)}
   <h3>Your two-week focus</h3>
   <p class="notes">{responseBody(focus)}</p>
  {/if}
  {#if activeItems.length||notes.trim()}
   <h3>Brainstorm</h3>
   {#if activeItems.length}<ul>{#each activeItems as item (item.id)}
    <li>{item.title}{plans[item.id].done?' (done)':plans[item.id].selected?' (this week)':''}</li>
   {/each}</ul>{/if}
   {#if notes.trim()}<p class="notes">{notes}</p>{/if}
  {/if}
 </aside>
</div>

<dialog class="modal" bind:this={locationDialog} aria-labelledby="story-location-title">
 {#if locationDraft}
  <form on:submit|preventDefault={applyLocation}>
   <h2 id="story-location-title">{location?'Edit location':'Add location'}</h2>
   <label>Street address<input autocomplete="street-address" bind:value={locationDraft.address} required/></label>
   <div class="date-grid">
    <label>City<input autocomplete="address-level2" bind:value={locationDraft.city} required/></label>
    <label>State<input autocomplete="address-level1" bind:value={locationDraft.state} required/></label>
   </div>
   <label>Place name<input bind:value={locationDraft.name} required/></label>
   {#if locationError}<p class="alert" role="alert">{locationError}</p>{/if}
   <div class="row wrap location-actions">
    <button type="submit" class="button primary">Apply location</button>
    <button type="button" class="button secondary" on:click={()=>locationDialog.close()}>Cancel</button>
    {#if location}<button type="button" class="text-button" on:click={clearLocation}>Clear location</button>{/if}
   </div>
  </form>
 {/if}
</dialog>

<style>
 .workflow{display:grid;grid-template-columns:minmax(0,2fr) minmax(0,1fr);gap:24px;align-items:start}
 .tabs{margin-bottom:14px;gap:8px}
 .tabs button{font-size:13px}
 .editor-panel{padding:24px;min-width:0}
 .build{overflow-wrap:anywhere;background:#edf0e4}
 .group{border-top:1px solid var(--line);padding-top:16px;margin-top:20px}
 legend{font-weight:600}
 label{font-size:13px;margin-top:14px}
 .fine{margin:8px 0}
 .action{border:1px solid var(--line);border-radius:7px;padding:14px;margin-top:12px;overflow-wrap:anywhere}
 .choice{display:flex;align-items:baseline;gap:8px;margin:0}
 .choice input{width:auto;margin:0}
 .action .group .choice{margin-top:14px}
 .notes{white-space:pre-wrap;overflow-wrap:anywhere}
 .save-row{margin-top:14px}
 .location-summary,.location-actions{margin-top:18px}
 .location-summary p{margin:4px 0 0;overflow-wrap:anywhere}
 @media(max-width:950px){.workflow{grid-template-columns:1fr}}
 @media(max-width:560px){.editor-panel,.build{padding:16px}.date-grid{grid-template-columns:1fr;gap:0}}
</style>
