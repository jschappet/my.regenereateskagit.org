import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {geoMercator,geoPath} from 'd3';
import {experimentMapPlaces} from '../src/lib/experiment-map.mjs';

const point={latitude:48.42,longitude:-122.33,name:'Garden'};
const draft=(id,doc_type,meta={})=>({revision:{document_id:id},doc_type,title:id,meta});
const linkedStory=(id,locations)=>draft('story-'+id,'story',{
 links:[{relation:'part_of',targets:[{document_id:id}]}],workspace_locations:locations,
});

test('map pins use saved coordinates for owned experiments and group matching places',()=>{
 const first=draft('first','experiment');
 const second=draft('second','experiment');
 const documents=[
  first,second,linkedStory('first',[point,point]),linkedStory('second',[point]),
  linkedStory('other',[{latitude:48.5,longitude:-122}]),
  linkedStory('first',[{latitude:null,longitude:-122},{latitude:92,longitude:0}]),
 ];
 assert.deepEqual(experimentMapPlaces([first,second],documents),[{
  key:'-122.33,48.42',coordinates:[-122.33,48.42],experiments:[
   {id:'first',title:'first',location:'Garden'},{id:'second',title:'second',location:'Garden'},
  ],
 }]);
});

test('an existing map submission supplies a pin when the experiment has no saved coordinates',()=>{
 const experiment=draft('experiment','experiment');
 const copy=draft('copy','experiment',{journey_version:1,experiment_id:'raft-story-experiment',
  latitude:48.42,longitude:-122.33,location:'Garden'});
 const [place]=experimentMapPlaces([experiment],[experiment,copy]);
 assert.deepEqual(place.coordinates,[-122.33,48.42]);
 assert.deepEqual(place.experiments,[{id:'experiment',title:'experiment',location:'Garden'}]);
});

test('the bundled geography fits the watershed at desktop and mobile sizes',()=>{
 const data=JSON.parse(readFileSync(new URL('../static/map/skagit-geography.json',import.meta.url)));
 for(const [width,height] of [[900,480],[340,290]]){
  const projection=geoMercator().fitExtent([[24,24],[width-24,height-24]],data.basins);
  const path=geoPath(projection);
  const [[left,top],[right,bottom]]=path.bounds(data.basins);
  assert.ok(left>=23&&top>=23&&right<=width-23&&bottom<=height-23);
  const [x,y]=projection([-122.33,48.42]);
  assert.ok(x>24&&x<width-24&&y>24&&y<height-24);
  assert.ok(path(data.rivers)?.startsWith('M'));
 }
});

test('address-only locations are discoverable even when another saved location already has a pin',async()=>{
 const {unmappedExperimentLocations}=await import('../src/lib/experiment-map.mjs');
 const experiment=draft('first','experiment');
 const missing={name:'Second garden',address:'1800 Continental Pl',latitude:null,longitude:null};
 const story=linkedStory('first',[point,missing]);
 assert.deepEqual(unmappedExperimentLocations([experiment],[experiment,story]),[
  {experiment,document:story,location:missing,index:1},
 ]);
});

test('community locations stay separate from personal pins even at the same coordinates',async()=>{
 const {communityMapPlaces}=await import('../src/lib/experiment-map.mjs');
 const [place]=communityMapPlaces([
  {id:'story',title:'Community story',viewer_id:'experiment',...point},
  {id:'other',title:'Published story',...point},
  {id:'invalid',title:'Missing coordinates',latitude:null,longitude:null},
 ]);
 assert.equal(place.key,'community:-122.33,48.42');
 assert.equal(place.coordinateKey,'-122.33,48.42');
 assert.equal(place.community,true);
 assert.equal(place.experiments.length,2);
 assert.equal(place.experiments[0].href,'/view/?id=experiment');
});
