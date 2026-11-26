import test from 'node:test';
import assert from 'node:assert/strict';
import {findSkagitAddress} from '../src/lib/skagit-address.mjs';

const address={address:'1800 Continental Pl.',city:'Mount Vernon',state:'WA'};
const record=(street,latitude)=>({attributes:{GeneralAddress:street,Latitude:latitude,Longitude:-122.32511879}});

test('the county lookup sends the house number and city and matches the street locally',async()=>{
 const point=await findSkagitAddress(address,async(url,options)=>{
  const query=url.searchParams.get('where');
  assert.match(query,/1800/);
  assert.match(query,/MOUNT VERNON/);
  assert.doesNotMatch(query,/CONTINENTAL/i);
  assert.equal(options.referrerPolicy,'no-referrer');
  return {ok:true,json:async()=>({features:[record('1800 OTHER PLACE',48.45),record('1800 CONTINENTAL PLACE',48.43718933)]})};
 });
 assert.deepEqual(point,{latitude:48.43718933,longitude:-122.32511879});
});

test('ambiguous matches and out-of-state addresses never produce a pin',async()=>{
 await assert.rejects(findSkagitAddress(address,async()=>({ok:true,json:async()=>({
  features:[record('1800 CONTINENTAL PLACE',48.43),record('1800 CONTINENTAL PLACE',48.44)],
 })})),/unique match/);
 await assert.rejects(findSkagitAddress({...address,state:'OR'},async()=>{
  assert.fail('Should not query for an out-of-state address');
 }),/Washington/);
});

test('city lookup accepts spaces, hyphens, and extra whitespace',async()=>{
 for(const city of ['Sedro Woolley','Sedro-Woolley','  sedro   woolley  ','Sedro – Woolley']){
  const point=await findSkagitAddress({address:'123 Example St',city,state:'WA'},async url=>{
   const query=url.searchParams.get('where');
   assert.match(query,/UPPER\(Post_Comm\) IN \((?:'SEDRO-WOOLLEY','SEDRO WOOLLEY'|'SEDRO WOOLLEY','SEDRO-WOOLLEY')\)/);
   return {ok:true,json:async()=>({features:[record('123 EXAMPLE STREET',48.5)]})};
  });
  assert.equal(point.latitude,48.5);
 }
});
