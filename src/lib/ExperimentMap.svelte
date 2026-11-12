<script>
 import {onMount} from 'svelte';
 import {geoMercator,geoPath,select,zoom,zoomIdentity} from 'd3';
 import {api,documents} from './workspace';
 import {documentUrl} from './document-links.mjs';
 import {communityMapPlaces,experimentMapPlaces,unmappedExperimentLocations} from './experiment-map.mjs';

 /** @type {import('./types').Draft[]} */
 export let experiments;

 const basinColors=['#e4ead8','#d9e3ce','#d0ddc4','#e8eddc'];
 const maxZoom=12;
 let svg,behavior,geography,error='',selected='',width=0,height=0;
 let transform=zoomIdentity;
 let community=[], communityError='';

 $: ownPlaces=experimentMapPlaces(experiments,$documents);
 $: ownKeys=new Set(ownPlaces.map(place=>place.key));
 $: places=[...communityMapPlaces(community),...ownPlaces];
 $: unmapped=unmappedExperimentLocations(experiments,$documents);
 $: current=places.find(place=>place.key===selected);
 $: projection=geography&&width>64&&height>64
  ? geoMercator().fitExtent([[24,24],[width-24,height-24]],geography.basins) : null;
 $: path=projection?geoPath(projection):null;
 $: riverPath=path&&geography?path(geography.rivers):'';
 $: pins=projection?places.map(place=>{
  const [x,y]=transform.apply(projection(place.coordinates));
  return {place,point:[x+(place.community&&ownKeys.has(place.coordinateKey)?34:0),y]};
 }).filter(({point:[x,y]})=>x>=16&&x<=width-16&&y>=16&&y<=height-16):[];

 onMount(()=>{
  const controller=new AbortController();
  behavior=zoom().scaleExtent([1,maxZoom])
   .filter(event=>event.type==='wheel' ? event.ctrlKey||event.metaKey : (!event.ctrlKey&&!event.button))
   .on('zoom',event=>{transform=event.transform;});
  select(svg).call(behavior);
  fetch('/map/skagit-geography.json',{signal:controller.signal})
   .then(response=>{
    if(!response.ok)throw new Error('Map geography unavailable');
    return response.json();
   })
   .then(data=>{geography=data;})
   .catch(()=>{if(!controller.signal.aborted)error='The watershed map couldn’t load.';});
  api.has('member_experiment_map')
   .then(available=>available?api.call('member_experiment_map'):[])
   .then(records=>{if(!controller.signal.aborted)community=records??[];})
   .catch(()=>{if(!controller.signal.aborted)communityError='Community experiments couldn’t load.';});
  return ()=>{controller.abort();select(svg).on('.zoom',null);};
 });

 function zoomBy(factor){if(behavior)select(svg).call(behavior.scaleBy,factor);}
 function reset(){if(behavior)select(svg).call(behavior.transform,zoomIdentity);}
</script>

<section class="panel experiment-map" aria-label="Experiment map">
 <div class="map-header">
  <div><h2>Map view</h2><p>Skagit watershed</p></div>
  <div class="map-controls" role="group" aria-label="Map zoom">
   <button type="button" class="button secondary" on:click={()=>zoomBy(1/1.5)} disabled={!path||transform.k<=1} aria-label="Zoom out">−</button>
   <button type="button" class="button secondary" on:click={()=>zoomBy(1.5)} disabled={!path||transform.k>=maxZoom} aria-label="Zoom in">+</button>
   <button type="button" class="button secondary" on:click={reset} disabled={!path}>Reset view</button>
  </div>
 </div>

 <div class="map-stage" bind:clientWidth={width} bind:clientHeight={height}>
  <svg bind:this={svg} viewBox={'0 0 '+width+' '+height} role="img" aria-label="Skagit watershed basins and streams">
   {#if path&&geography}
    <g transform={transform.toString()}>
     {#each geography.basins.features as basin,index (basin.id)}
      <path d={path(basin)} fill={basinColors[index%basinColors.length]} stroke="#abbfa9" stroke-width=".7" vector-effect="non-scaling-stroke"/>
     {/each}
     <path d={riverPath} fill="none" stroke="#6c9997" stroke-width=".8" opacity=".8" vector-effect="non-scaling-stroke"/>
    </g>
   {/if}
  </svg>
  {#each pins as {place,point:[x,y]} (place.key)}
   <button type="button" class="map-pin" class:community={place.community} style:left={x+'px'} style:top={y+'px'} aria-pressed={selected===place.key}
    aria-label={(place.community?'Community: ':'Yours: ')+place.experiments.map(experiment=>experiment.title).join(', ')}
    on:click={()=>{selected=selected===place.key?'':place.key;}}>
    <span aria-hidden="true">{place.experiments.length>1?place.experiments.length:place.community?'○':'◆'}</span>
   </button>
  {/each}
  {#if error}<p class="map-status" role="status">{error}</p>
  {:else if !geography}<p class="map-status" role="status">Loading watershed map…</p>{/if}
 </div>

 <div class="map-legend" aria-label="Map legend">
  <span><b aria-hidden="true">◆</b> Your experiments</span>
  <span><b class="community" aria-hidden="true">○</b> Community experiments</span>
 </div>
 {#if communityError}<p class="fine" role="status">{communityError}</p>{/if}
 {#if current}
  <ul class="map-selection" aria-label="Experiments at this location">
   {#each current.experiments as experiment (experiment.id)}
    <li><a class="text-link" href={experiment.href??('/experiments/?id='+encodeURIComponent(experiment.id))}>{experiment.title}</a>
     {#if experiment.location}<span>{experiment.location}</span>{/if}</li>
   {/each}
  </ul>
 {:else if !ownPlaces.length&&!unmapped.length}
  <p class="fine">Add coordinates to an experiment’s location to see it here.</p>
 {/if}
 {#if unmapped.length}
  <div class="map-unmapped">
   <h3>Saved locations without pins</h3>
   <p class="fine">Open a location to edit its address and place it on your map.</p>
   <ul class="map-selection">
    {#each unmapped as entry (entry.document.revision.document_id+':'+entry.index)}
     <li>
      <a class="text-link" href={documentUrl(entry.document.revision.document_id,$documents)}>{entry.location.name||entry.location.address} · {entry.experiment.title}</a>
     </li>
    {/each}
   </ul>
  </div>
 {/if}
 <p class="fine map-credit">Basin and stream coverage follows the <a class="text-link" href="https://regenerateskagit.org/atlas/#sources">Regenerate Skagit atlas</a> and its Skagit County GIS data.</p>
</section>

<style>
 .experiment-map{margin-bottom:28px}
 .map-header{display:flex;justify-content:space-between;align-items:end;gap:12px;flex-wrap:wrap;margin-bottom:14px}
 h2{margin:0 0 4px}
 .map-header p{margin:0;color:var(--muted)}
 .map-controls{display:flex;gap:6px;flex-wrap:wrap}
 .map-controls .button{min-width:42px;min-height:42px;padding:6px 12px}
 .map-stage{position:relative;overflow:hidden;border:1px solid #c8d8d0;border-radius:9px;background:#dce9e5;height:clamp(290px,43vw,490px)}
 svg{display:block;width:100%;height:100%;touch-action:none;cursor:grab}
 svg:active{cursor:grabbing}
 .map-pin{position:absolute;transform:translate(-50%,-50%);width:36px;height:36px;border:2px solid #fff;border-radius:50%;background:#26574b;color:#fff;font-weight:700;box-shadow:0 2px 5px #193e3550}
 .map-pin.community{background:#d9ead8;color:#285449;border-color:#729580}
 .map-pin[aria-pressed="true"]{outline:3px solid #83512c;z-index:1}
 .map-legend{display:flex;flex-wrap:wrap;gap:8px 18px;margin-top:10px;font-size:13px}
 .map-legend span{display:inline-flex;align-items:center;gap:6px}
 .map-legend b{display:inline-grid;place-items:center;border-radius:50%;width:22px;height:22px;background:#26574b;color:#fff}
 .map-legend b.community{background:#d9ead8;color:#285449;border:1px solid #729580}
 .map-pin:focus-visible{outline:3px solid #193e35;outline-offset:2px;z-index:2}
 .map-status{position:absolute;inset:40% 16px auto;text-align:center;pointer-events:none}
 .map-selection{list-style:none;padding:0;margin:14px 0 0}
 .map-selection li{display:flex;gap:6px 16px;flex-wrap:wrap}
 .map-selection span{color:var(--muted)}
 .map-unmapped{margin-top:18px}
 .map-unmapped h3{margin:0}
 .map-unmapped li{align-items:center;justify-content:space-between}
 .map-credit{margin-bottom:0}
</style>
