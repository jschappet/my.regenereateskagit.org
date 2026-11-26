import {experimentParent} from './document-links.mjs';

export function sourceDocument(url,documents){
 const route=url.pathname.replace(/\/$/,'');
 const id=url.searchParams.get('id');
 const current=documents.find(doc=>doc.revision.document_id===id);
 if(route==='/documents')return current;
 if(route!=='/experiments'||current?.doc_type!=='experiment')return undefined;
 const draft=documents.find(doc=>doc.revision.document_id===url.searchParams.get('draft'));
 return draft&&experimentParent(draft,documents)===current ? draft : current;
}

export function sourceLink(document,url){
 if(document)return [{relation:'grew_from',targets:[document]}];
 if(!url.trim())throw new Error('Enter the URL that inspired this experiment.');
 let target;
 try{target=new URL(url.trim());}catch{/* Report invalid and unsupported URLs together. */}
 if(!target||!['http:','https:'].includes(target.protocol)||target.username||target.password){
  throw new Error('Enter a full HTTP or HTTPS URL without embedded credentials.');
 }
 return [{relation:'grew_from',targets:[{url:target.href}]}];
}
