<script lang="ts">
 import {newLocation,locationsFor,type ExperimentLocation} from './experiment-locations';
 import type {Draft} from './types';

 export let locations:ExperimentLocation[]=[];
 export let otherStages:Draft[]=[];
 export let legacyName='';
 export let update:(locations:ExperimentLocation[])=>void;

 const stageLabels:Record<string,string>={exploration:'Research',action:'Action',story:'Story'};
 const fields=['name','address','city','state'] as const;
 const labels={name:'Name',address:'Street address',city:'City',state:'State'};
 let expanded='';
 $: associated=otherStages.flatMap(stage=>[
  ...locationsFor(stage).map(location=>({name:location.name,coordinates:location.latitude!==null&&location.longitude!==null?`${location.latitude}, ${location.longitude}`:'',address:[location.address,location.city,location.state].join(', '),stage:stageLabels[stage.doc_type],title:stage.title})),
  ...(stage.meta.workspace_place?[{name:String(stage.meta.workspace_place),address:'',coordinates:'',stage:stageLabels[stage.doc_type],title:stage.title}]:[]),
 ]);

 function add(name=''){
  const location=newLocation(name);
  update([...locations,location]);
  expanded=location.id;
 }

 function edit(id:string,patch:Partial<ExperimentLocation>){
  update(locations.map(location=>location.id===id?{...location,...patch}:location));
 }

 function coordinate(input:HTMLInputElement){
  return Number.isFinite(input.valueAsNumber)?input.valueAsNumber:null;
 }
</script>

<section aria-label="Locations">
 <div class="row between">
  <h3>Locations for this stage</h3>
  <button type="button" class="button secondary" on:click={()=>add()}>Add Location</button>
 </div>
 <p class="fine">Save this stage to keep your changes. Choose what to publish separately at the Map step.</p>
 {#if legacyName}
  <p>Earlier place: {legacyName} <button type="button" class="text-button" on:click={()=>add(legacyName)}>Add details</button></p>
 {/if}
 {#each locations as location (location.id)}
  <div class="panel location">
   <div class="row between">
    <div>
     <strong>{location.name||'New location'}</strong>
     {#if location.address||location.city||location.state}
      <div class="fine">{[location.address,location.city,location.state].filter(Boolean).join(', ')}</div>
     {/if}
     {#if location.latitude!==null&&location.longitude!==null}<div class="fine">{location.latitude}, {location.longitude}</div>{/if}
    </div>
    <button type="button" class="text-button" aria-expanded={expanded===location.id} on:click={()=>expanded=expanded===location.id?'':location.id}>
     {expanded===location.id?'Done editing':'Edit'}
    </button>
   </div>
   {#if expanded===location.id}
    {#each fields as field}
     <label>{labels[field]}<input value={location[field]} on:input={e=>edit(location.id,{[field]:e.currentTarget.value})}/></label>
    {/each}
    <div class="date-grid">
     <label>Latitude (optional)<input type="number" min="-90" max="90" step="any" value={location.latitude??''}
      on:input={e=>edit(location.id,{latitude:coordinate(e.currentTarget)})}/></label>
     <label>Longitude (optional)<input type="number" min="-180" max="180" step="any" value={location.longitude??''}
      on:input={e=>edit(location.id,{longitude:coordinate(e.currentTarget)})}/></label>
    </div>
    <button type="button" class="text-button remove" on:click={()=>update(locations.filter(item=>item.id!==location.id))}>Remove location</button>
   {/if}
  </div>
 {:else}
  {#if !legacyName}<p class="fine">No locations added to this stage yet.</p>{/if}
 {/each}

 <h4>Locations from other stages</h4>
 {#if associated.length}
  <ul>
   {#each associated as location}
    <li><strong>{location.name}</strong> · {location.stage}{location.stage==='Action'?' / '+location.title:''}
     {#if location.address}<div class="fine">{location.address}</div>{/if}
     {#if location.coordinates}<div class="fine">{location.coordinates}</div>{/if}
    </li>
   {/each}
  </ul>
 {:else}
  <p class="fine">No locations saved in other stages yet.</p>
 {/if}
</section>

<style>
 section{margin-top:24px}
 h3{margin:0}
 h4{margin:18px 0 8px}
 .location{margin-bottom:10px;padding:16px}
 .remove{margin-top:12px}
</style>
