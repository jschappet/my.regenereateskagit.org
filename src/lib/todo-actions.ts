import {draftTags} from './content.mjs';
import {linksTo} from './journey.mjs';
import {isMapCopy} from './raft-flow.mjs';
import type {Draft} from './types';

export type BrainstormItem = {
 id:string;
 title:string;
 description?:string;
 tags?:string[];
 expected_minutes?:number;
 removed?:boolean;
};

export function todoActions(experiments:Draft[],documents:Draft[]){
 return experiments.flatMap(experiment=>{
  const id=experiment.revision.document_id;
  const children=documents.filter(draft=>linksTo(draft,id,['part_of']));
  const brainstorm=children.find(draft=>draft.doc_type==='brainstorm');
  const items:BrainstormItem[]=Array.isArray(brainstorm?.meta?.items)?brainstorm.meta.items:[];
  const acts=new Map(children.filter(draft=>draft.doc_type==='act').map(draft=>[draft.meta?.brainstorm_item_id,draft]));
  return items.filter(item=>item?.id&&item.title&&!item.removed).map(item=>{
   const act=acts.get(item.id);
   const plan=act?.meta?.plan;
   return {experiment,brainstorm:brainstorm!,item,act,
    description:item.description||act?.description||plan?.task||'',
    tags:[...new Set([...(Array.isArray(item.tags)?item.tags:[]),...draftTags(act??{} as Draft)])],
    minutes:item.expected_minutes??(plan?.duration||null),done:plan?.done===true};
  });
 });
}

export type Todo = ReturnType<typeof todoActions>[number];

export function todoExperiments(documents:Draft[],userId:number|undefined){
 return documents.filter(doc=>doc.submitted_by===userId&&doc.doc_type==='experiment'&&!isMapCopy(doc));
}
