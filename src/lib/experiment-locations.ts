import type {Draft} from './types';

export interface ExperimentLocation {
 id:string;
 name:string;
 address:string;
 city:string;
 state:string;
 latitude:number|null;
 longitude:number|null;
}

export function newLocation(name=''):ExperimentLocation{
 return {id:crypto.randomUUID(),name,address:'',city:'',state:'',latitude:null,longitude:null};
}

export function validLocation(location:ExperimentLocation){
 return [location.name,location.address,location.city,location.state].every(value=>value.trim())
  && (location.latitude===null || Math.abs(location.latitude)<=90)
  && (location.longitude===null || Math.abs(location.longitude)<=180);
}

export function locationsFor(draft:Draft){
 return (draft.meta?.workspace_locations??[]) as ExperimentLocation[];
}
