export function experimentParent(doc,documents){
 if(doc.doc_type==='experiment')return doc;
 const parentIds=(doc.meta?.links??[])
  .filter(link=>['part_of','reports_on'].includes(link.relation))
  .flatMap(link=>link.targets.map(target=>target.document_id));
 return documents.find(candidate=>candidate.doc_type==='experiment'&&parentIds.includes(candidate.revision.document_id));
}

/** Resolve a workspace document, including a journey step, to its actual editor. */
export function documentUrl(id,documents){
 const doc=documents.find(d=>d.revision.document_id===id);
 if(!doc)return null;
 if(doc.doc_type==='experiment')return `/experiments/?id=${encodeURIComponent(id)}`;
 const parent=experimentParent(doc,documents);
 if(parent){
  const root=encodeURIComponent(parent.revision.document_id);
  if(parent.meta?.workflow_version!==2)return `/experiments/?id=${root}&draft=${encodeURIComponent(id)}`;
  const steps={spark:'spark',focus:'focus',brainstorm:'brainstorm',act:'act',story:'story'};
  if(steps[doc.doc_type])return `/experiments/?id=${root}&step=${steps[doc.doc_type]}`;
 }
 return `/documents/?id=${encodeURIComponent(id)}`;
}
export function referenceUrl(target,documents){
 if(target.document_id)return documentUrl(target.document_id,documents)||(target.invitation_id?`/invitations/?id=${encodeURIComponent(target.invitation_id)}`:null);
 if(target.url){try{const url=new URL(target.url);if(['https:','http:'].includes(url.protocol))return url.href;}catch{}}
 return null;
}
