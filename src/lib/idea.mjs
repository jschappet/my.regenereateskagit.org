export function ideaResponses(meta={}){
 const blank=()=>({sentence:'',notes:''});
 return {
  spark:Array.from({length:3},(_,index)=>({...blank(),...meta?.spark?.[index]})),
  focus:{...blank(),...meta?.focus},
 };
}

export function experimentStartingPoint(experiment,documents){
 const targets=(experiment.meta?.links??[]).filter(link=>link.relation==='grew_from').flatMap(link=>link.targets);
 return documents.find(doc=>doc.doc_type==='idea'&&targets.some(target=>target.document_id===doc.revision.document_id));
}
