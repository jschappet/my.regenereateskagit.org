/** Resolve a workspace document, including a journey step, to its actual editor. */
export function documentUrl(id,documents){
 const doc=documents.find(d=>d.revision.document_id===id);
 if(!doc)return null;
 if(doc.doc_type==='experiment')return `/experiments/?id=${encodeURIComponent(id)}`;
 const parent=doc.meta?.links?.find(l=>l.relation==='part_of')?.targets?.find(t=>t.document_id)?.document_id;
 const steps={brain_dump:'brain_dump',invitation:'invitation',participation:'participation',meeting_plan:'meeting_plan',experiment_start:'experiment_start',exploration:'exploration',action:'action',reflection:'reflection',story:'story',submission:'submission'};
 if(parent&&steps[doc.doc_type])return `/experiments/?id=${encodeURIComponent(parent)}&step=${steps[doc.doc_type]}`;
 return `/documents/?id=${encodeURIComponent(id)}`;
}
export function referenceUrl(target,documents){
 if(target.document_id)return documentUrl(target.document_id,documents)||(target.invitation_id?`/invitations/?id=${encodeURIComponent(target.invitation_id)}`:null);
 if(target.url){try{const url=new URL(target.url);if(['https:','http:'].includes(url.protocol))return url.href;}catch{}}
 return null;
}
