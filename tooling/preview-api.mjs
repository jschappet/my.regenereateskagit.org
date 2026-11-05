import {randomUUID} from 'node:crypto';
const uid=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const copy=value=>JSON.parse(JSON.stringify(value));
/** @returns {import('vite').Plugin} */
export function previewApi(){
 let signedIn=true,nextId=100,version=1000;const docs=new Map(),revisions=new Map(),rowToDocument=new Map();
 const date=new Date();const at=days=>{const d=new Date(date);d.setDate(d.getDate()+days);d.setHours(17,30,0,0);return d.toISOString();};
 function save(input,documentId,previous=null){const id=++nextId;const revision={draft_id:id,document_id:documentId,revision_id:uid(++version),previous_revision_id:previous?.revision.revision_id||null,revision_number:(previous?.revision.revision_number||0)+1,saved_at:new Date().toISOString().slice(0,-1).replace('T',' '),saved_by:7,change_kind:previous?'edit':'create',schema_version:1};const doc={...copy(input),id,status:input.status||'draft',submitted_by:7,author:'Jamie Rivers',revision};docs.set(documentId,doc);rowToDocument.set(id,documentId);revisions.set(documentId,[...(revisions.get(documentId)||[]),copy(doc)]);return doc;}
 const child=(n,type,title,body,parent,meta={})=>save({doc_type:type,title,body_md:body,meta:{workspace_version:1,...meta,links:[{relation:'part_of',targets:[{document_id:uid(parent)}]}]}},uid(n));
 save({doc_type:'interest',title:'What happens to our kitchen scraps?',body_md:'## Interest\n\nI’m curious about the life that begins when we stop calling something waste.\n\n## Why it matters\n\nI’d love our household to put more back into the soil, and less into the bin.',meta:{workspace_version:1}},uid(1));
 save({doc_type:'experiment',title:'A better home for our food scraps',description:'Finding a small, workable compost routine for our kitchen, with a little help from the garden.',body_md:'A two-week experiment in making something useful from what we usually throw away.',meta:{workspace_version:1,links:[{relation:'grew_from',targets:[{document_id:uid(1),title:'What happens to our kitchen scraps?'}]}]}},uid(2));
 child(3,'brain_dump','Compost possibilities','## Brain dump\n\nWorm bins, a garden drop-off, a small bucket by the sink. What about smells? Where could we get dry leaves?\n\n## Chosen experiment\n\nTry collecting kitchen scraps for a week and taking them to the community garden.\n\n## Hope\n\nTo find a habit that feels easy enough to keep.\n\n## Needs\n\nA lidded bucket, dry leaves, and a conversation with the garden.',2);
 child(4,'participation','Company for the process','## Arrangement\n\nSam is exploring neighborhood bird calls. We’ll share our research and what happens with our own experiments.',2,{participation:{mode:'partner',name:'Sam',agreed:true}});
 child(5,'meeting_plan','Two conversations','## Meeting details\n\nA short walk and a conversation at the park. We’ll each bring a few notes.',2,{schedule:{week_one:at(7),week_two:at(14),timezone:'America/Los_Angeles'}});
 child(6,'experiment_start','Beginning with curiosity','## Starting intention\n\nKeep it small. Notice what actually works in an ordinary week.',2,{started_at:at(-2),start_date:new Date(at(-2)).toISOString().slice(0,10)});
 child(7,'exploration','Notes from the garden','## Research and preparation\n\nThe community garden can take vegetable scraps on Saturdays. They suggested a small bucket and a layer of dry leaves.\n\n## Findings and intentions\n\nI’m going to try a kitchen bucket for seven days, then take it to the garden.\n\n## Questions and answers\n\nWhat would make this easy to keep doing?',2);
 save({doc_type:'interest',title:'Who shares our neighborhood?',body_md:'I want to notice the small lives and familiar sounds along the streets I walk every day.',meta:{workspace_version:1}},uid(8));
 save({doc_type:'experiment',title:'A quieter walk around the block',description:'Slowing down for ten minutes to notice who else is here. No special equipment, just attention.',body_md:'',meta:{workspace_version:1,links:[{relation:'grew_from',targets:[{document_id:uid(8),title:'Who shares our neighborhood?'}]}]}},uid(9));
 save({doc_type:'idea',title:'A tiny seed library',body_md:'What if neighbors could leave a few seeds and a small note about what grew well?',meta:{workspace_version:1}},uid(10));
 const work=[{id:uid(900),timestamp:at(-1).slice(0,-1),recorded_at:at(-1).slice(0,-1),notes:'Talked to the community garden about collecting scraps.',quantity_value:0.5,quantity_unit:'hours',from_entity:uid(700),to_entity:uid(2),resource_type:'work',host_id:1,created_by:uid(700),details:{document_id:uid(2),revision_id:docs.get(uid(2)).revision.revision_id}}];
 const publicRoutes=[['login','POST','/api/auth/login'],['logout','POST','/api/auth/logout'],['profile_json','GET','/api/profile']];
 const memberRoutes=[['content_list','GET','/api/drafts/list'],['content_document','GET','/api/drafts/document/{document_id}'],['content_get','GET','/api/drafts/get/{id}'],['content_create','POST','/api/drafts/create'],['content_update','POST','/api/drafts/update/{id}'],['content_history','GET','/api/drafts/get/{id}/history'],['content_revision','GET','/api/drafts/get/{id}/revisions/{revision_id}'],['content_restore','POST','/api/drafts/get/{id}/restore'],['content_graph','GET','/api/drafts/graph'],['content_work','GET','/api/drafts/get/{id}/work'],['content_record_work','POST','/api/drafts/get/{id}/work'],['content_work_markdown','GET','/api/drafts/get/{id}/work.md']];
 function graph(){const all=[...docs.values()];const edges=[],references=[];for(const doc of all)for(const link of doc.meta?.links||[])for(const target of link.targets){references.push({source:doc.revision.document_id,relation:link.relation,target});if(docs.has(target.document_id))edges.push({id:doc.revision.document_id+target.document_id+link.relation,from:doc.revision.document_id,to:target.document_id,relation:link.relation,source_revision_id:doc.revision.revision_id});}return {nodes:all.map(d=>({id:d.revision.document_id,title:d.title,node_type:d.doc_type,revision_id:d.revision.revision_id})),edges,references,work};}
 return {name:'raft-local-preview-api',apply:'serve',configureServer(server){server.middlewares.use(async(req,res,next)=>{
  if(!req.url?.startsWith('/api/'))return next();const url=new URL(req.url,'http://localhost');let raw='';for await(const chunk of req)raw+=chunk;
  let body={};try{body=raw?JSON.parse(raw):{};}catch{}
  const respond=(value,status=200,type='application/json')=>{res.statusCode=status;res.setHeader('Content-Type',type);res.setHeader('Cache-Control','no-store');res.end(type==='application/json'?JSON.stringify(value):value);};
  if(url.pathname==='/api/config/capabilities')return respond([...publicRoutes,...signedIn?memberRoutes:[]].map(([key,method,url])=>({key,method,url,auth:!publicRoutes.some(r=>r[0]===key)})));
  if(url.pathname==='/api/profile')return respond({authenticated:signedIn,user:signedIn?{id:7,display_name:'Jamie Rivers'}:null,roles:signedIn?['member']:[],preview:true});
  if(url.pathname==='/api/auth/login'){signedIn=true;return respond({message:'Signed into local preview'});}
  if(url.pathname==='/api/auth/logout'){signedIn=false;return respond('Logged out',200,'text/plain');}
  if(!signedIn)return respond({message:'Sign in to continue'},401);
  if(url.pathname==='/api/drafts/list')return respond({drafts:[...docs.values()].reverse(),meta:{total:docs.size}});
  if(url.pathname==='/api/drafts/graph')return respond(graph());
  if(url.pathname==='/api/drafts/create'){
   if(docs.has(body.document_id))return respond({message:'Document identity already exists'},409);
   return respond(save(body,body.document_id||randomUUID()));
  }
  let match=url.pathname.match(/^\/api\/drafts\/document\/([^/]+)$/);if(match)return docs.has(match[1])?respond(docs.get(match[1])):respond({message:'Document not found'},404);
  match=url.pathname.match(/^\/api\/drafts\/(?:get|update)\/(\d+)(?:\/(.*))?$/);
  if(!match)return respond({message:'Capability not found'},404);
  const documentId=rowToDocument.get(Number(match[1])),doc=docs.get(documentId);if(!doc)return respond({message:'Document not found'},404);
  if(url.pathname.includes('/update/')){
   if(doc.id!==Number(match[1])||req.headers['if-match']!==`"${doc.revision.revision_id}"`)return respond({message:'Another version was saved.'},409);
   return respond(save({...doc,...body},documentId,doc));
  }
  const action=match[2];if(!action)return respond(doc);
  if(action==='history')return respond(revisions.get(documentId).map(d=>d.revision).reverse());
  if(action.startsWith('revisions/')){const old=revisions.get(documentId).find(d=>d.revision.revision_id===action.split('/')[1]);return old?respond(old):respond({message:'Revision not found'},404);}
  if(action==='restore'){
   if(body.expected_revision_id!==doc.revision.revision_id)return respond({message:'Another version was saved.'},409);
   const old=revisions.get(documentId).find(d=>d.revision.revision_id===body.revision_id);if(!old)return respond({message:'Revision not found'},404);
   return respond(save({...old,status:doc.status},documentId,doc));
  }
  if(action==='work'&&req.method==='POST'){
   const existing=work.find(w=>w.id===body.event_id);if(existing)return respond(existing);
   const entry={id:body.event_id,timestamp:body.occurred_at.replace(/Z$/,''),recorded_at:new Date().toISOString().slice(0,-1),notes:body.description,quantity_value:body.hours??1,quantity_unit:body.hours?'hours':'count',to_entity:documentId,from_entity:uid(700),details:{revision_id:body.revision_id,document_id:documentId}};work.push(entry);return respond(entry);
  }
  if(action==='work')return respond(work.filter(w=>w.to_entity===documentId));
  if(action==='work.md'){const entries=work.filter(w=>w.to_entity===documentId);return respond(`---\ntype: work_log\ndocument_id: ${documentId}\nentries: ${JSON.stringify(entries)}\n---\n\n# Work log\n\n${entries.map(w=>`## ${w.timestamp}\n\n${w.notes}`).join('\n\n')}`,200,'text/markdown');}
  return respond({message:'Capability not found'},404);
 });}};
}
