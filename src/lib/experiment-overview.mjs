import {documentUrl,experimentParent,referenceUrl} from './document-links.mjs';
import {experimentDocuments,linksTo,steps} from './journey.mjs';

export function experimentOverviewStages(experiment,documents){
 const related=experimentDocuments(experiment,documents);
 const stages=experiment.meta?.workflow_version===2
  ? [['act','Act'],['story','Story So Far']]
  : steps.map(step=>[step.type,step.short]);
 const root=experiment.revision.document_id;
 const storyIds=(experiment.meta?.links??[]).flatMap(link=>link.targets.map(target=>target.document_id));
 const stories=documents.filter(doc=>doc.doc_type==='story'
  &&(linksTo(doc,root,['part_of','reports_on','related_to'])||storyIds.includes(doc.revision.document_id)));
 return stages.map(([type,label])=>({type,label,drafts:type==='story'?stories:related.filter(doc=>doc.doc_type===type||(type==='act'&&doc.doc_type==='brainstorm'))}));
}

export function experimentLineage(experiment,documents,references=[]){
 const byId=new Map(documents.map(doc=>[doc.revision.document_id,doc]));
 const origins=new Map();
 const followups=new Map();
 const root=experiment.revision.document_id;
 const readUrl=id=>'/experiments/?id='+encodeURIComponent(id)+'&read=1';

 for(const doc of documents){
  if(!['experiment','idea','interest'].includes(doc.doc_type))continue;
  const id=doc.revision.document_id;
  const sources=new Map();
  for(const link of doc.meta?.links??[]){
   if(!['grew_from','part_of'].includes(link.relation))continue;
   for(const target of link.targets){
    const source=byId.get(target.document_id);
    const original=source&&experimentParent(source,documents);
    const sourceId=original?.revision.document_id??target.document_id??target.url;
    if(!sourceId||sourceId===id)continue;
    const resolved=references.find(ref=>ref.source===id&&ref.relation===link.relation
     &&ref.target.document_id===target.document_id);
    const related=original??source;
    const href=related?.doc_type==='experiment'?readUrl(sourceId)
     : related?documentUrl(sourceId,documents):referenceUrl(resolved?.target??target,documents);
    const via=original&&original!==source?source.title:'';
    sources.set(sourceId,{id:sourceId,title:related?.title||target.title||target.url||'Original document',href,via});
    if(!followups.has(sourceId))followups.set(sourceId,new Map());
    followups.get(sourceId).set(id,{id,title:doc.title,
     href:doc.doc_type==='experiment'?readUrl(id):documentUrl(id,documents),via});
   }
  }
  origins.set(id,sources);
 }
 function branch(index,id,visited){
  return [...(index.get(id)?.values()??[])].filter(node=>node.id!==root).map(node=>{
   if(visited.has(node.id))return {...node,children:[]};
   visited.add(node.id);
   return {...node,children:branch(index,node.id,visited)};
  });
 }
 return {ancestors:branch(origins,root,new Set()),descendants:branch(followups,root,new Set())};
}
