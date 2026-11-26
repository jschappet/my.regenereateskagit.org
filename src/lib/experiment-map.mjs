import {linksTo} from './journey.mjs';
import {isMapCopy,mapKey} from './raft-flow.mjs';

function validPoint(location){
 const {latitude,longitude}=location??{};
 return Number.isFinite(latitude)&&Math.abs(latitude)<=90
  &&Number.isFinite(longitude)&&Math.abs(longitude)<=180;
}

function locationDocuments(experiment,documents){
 const id=experiment.revision.document_id;
 return [experiment,...documents.filter(doc=>
  ['exploration','action','story'].includes(doc.doc_type)&&linksTo(doc,id))];
}

export function unmappedExperimentLocations(experiments,documents){
 return experiments.flatMap(experiment=>locationDocuments(experiment,documents).flatMap(document=>
  Array.isArray(document.meta?.workspace_locations)
   ? document.meta.workspace_locations.flatMap((location,index)=>location?.address&&!validPoint(location)
      ? [{experiment,document,location,index}] : [])
   : []));
}

export function experimentMapPlaces(experiments,documents){
 const places=new Map();
 const publications=new Map(documents.filter(isMapCopy).map(doc=>[doc.meta.experiment_id,doc]));
 for(const experiment of experiments){
  const id=experiment.revision.document_id;
  const locations=locationDocuments(experiment,documents).flatMap(doc=>[
   ...(Array.isArray(doc.meta?.workspace_locations)?doc.meta.workspace_locations:[]),
   doc.meta?.feed_location,
  ]).filter(validPoint);
  const published=publications.get(mapKey(id))?.meta;
  if(!locations.length&&validPoint(published))locations.push({...published,name:published.location});
  for(const location of locations){
   const {latitude,longitude}=location;
   const key=longitude+','+latitude;
   if(!places.has(key))places.set(key,{key,coordinates:[longitude,latitude],experiments:[]});
   const place=places.get(key);
   if(!place.experiments.some(experiment=>experiment.id===id)){
    place.experiments.push({id,title:experiment.title,location:location.name??''});
   }
  }
 }
 return [...places.values()];
}

export function communityMapPlaces(records){
 const places=new Map();
 for(const record of records.filter(validPoint)){
  const {id,title,latitude,longitude,viewer_id}=record;
  const coordinateKey=longitude+','+latitude;
  const key='community:'+coordinateKey;
  if(!places.has(key))places.set(key,{key,coordinateKey,community:true,coordinates:[longitude,latitude],experiments:[]});
  const place=places.get(key);
  if(!place.experiments.some(experiment=>experiment.id===id)){
   place.experiments.push({id,title,location:'',href:viewer_id
    ? '/view/?id='+encodeURIComponent(viewer_id)
    : 'https://regenerateskagit.org/experiments/map/'});
  }
 }
 return [...places.values()];
}
