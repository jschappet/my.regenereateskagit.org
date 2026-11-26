// Skagit County's parcel-adjusted Site Structure Address Points.
const service='https://geo.skagitcountywa.gov/server/rest/services/PortalServiceLayers/Official_Addresses_Parcel/MapServer/0/query';
const abbreviations={
 AVENUE:'AVE',BOULEVARD:'BLVD',COURT:'CT',DRIVE:'DR',HIGHWAY:'HWY',LANE:'LN',
 PLACE:'PL',ROAD:'RD',STREET:'ST',TERRACE:'TER',TRAIL:'TRL',WAY:'WAY',
 NORTH:'N',SOUTH:'S',EAST:'E',WEST:'W',NORTHEAST:'NE',NORTHWEST:'NW',
 SOUTHEAST:'SE',SOUTHWEST:'SW',APARTMENT:'UNIT',APT:'UNIT',SUITE:'UNIT',STE:'UNIT',
};
function normalize(address){
 return (address??'').toUpperCase().replace(/[.,]/g,'').replace(/#/g,' UNIT ')
  .trim().split(/\s+/).map(word=>abbreviations[word]??word).join(' ');
}

export async function findSkagitAddress({address,city,state},fetchAddress=fetch){
 const number=address.trim().match(/^\d+(?=\s)/)?.[0];
 if(!number||!city?.trim()||!['WA','WASHINGTON'].includes(state?.trim().toUpperCase())){
  throw new Error('Enter a numbered street address and city in Skagit County, Washington.');
 }
 const community=city.trim().toUpperCase().replace(/\s+/g,' ').replace(/\s*[-–—]\s*/g,'-');
 // Keep ordinary spaces valid for names such as Mount Vernon while accepting
 // either spelling for hyphenated names such as Sedro-Woolley.
 const communities=[...new Set([community,community.replaceAll('-',' '),community.replaceAll(' ','-')])]
  .map(name=>`'${name.replaceAll("'","''")}'`).join(',');
 const url=new URL(service);
 url.search=new URLSearchParams({
  where:`Add_Number=${number} AND (UPPER(Post_Comm) IN (${communities}) OR UPPER(Mncplty) IN (${communities}))`,
  outFields:'GeneralAddress,FullAddress,Latitude,Longitude',
  returnGeometry:'false',
  f:'json',
 }).toString();
 const response=await fetchAddress(url,{credentials:'omit',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(10000)});
 if(!response.ok)throw new Error('Skagit County’s address lookup is unavailable. Try again or enter coordinates manually.');
 const data=await response.json();
 if(!Array.isArray(data.features)||data.exceededTransferLimit){
  throw new Error('Skagit County’s address lookup could not verify a match.');
 }
 const street=normalize(address);
 const points=new Map();
 for(const {attributes} of data.features){
  if(!attributes||![attributes.GeneralAddress,attributes.FullAddress].some(value=>normalize(value)===street))continue;
  const {Latitude:latitude,Longitude:longitude}=attributes;
  if(Number.isFinite(latitude)&&Math.abs(latitude)<=90&&Number.isFinite(longitude)&&Math.abs(longitude)<=180){
   points.set(latitude.toFixed(5)+','+longitude.toFixed(5),{latitude,longitude});
  }
 }
 if(points.size!==1)throw new Error('Skagit County couldn’t verify a unique match. Check the address or enter coordinates manually.');
 return points.values().next().value;
}
