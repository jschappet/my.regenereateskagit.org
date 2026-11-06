import {randomUUID} from 'node:crypto';import {readFileSync} from 'node:fs';
const uid=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const copy=value=>JSON.parse(JSON.stringify(value));
/** @returns {import('vite').Plugin} */
export function previewApi(){
 let signedIn=true,previewUser=7,nextId=100,version=1000;const docs=new Map(),revisions=new Map(),rowToDocument=new Map();
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
 child(11,'invitation','A little company','## Invitation\n\nWould you like to try a small experiment alongside mine? We can share what we learn over two short conversations.',2);
 const invitations=new Map([[uid(20),{id:uid(20),title:'A small experiment in neighborhood care',body:'Would you like to explore a small question of your own alongside mine?\n\nWe’ll each keep our own experiment and meet twice to share what we learn.',sender_name:'Sam Green',recipient:true,status:'pending',experiment_id:null,following_requested:false}]]);
 const shares=new Map();const responses=new Map();const viewerSections=new Map();const definitions=new Map();
 for(const [i,purpose] of ['feedback','follow','collaboration'].entries()){
  const document_id=uid(70+i),share_id=uid(90+i),group_id=uid(80+i);
  const title=purpose==='feedback'?'How did the compost experiment affect you?':purpose==='follow'?'Follow our compost learning':'Explore alongside our compost experiment';
  const body=purpose==='feedback'?'Tell us what changed for you. Feedback, a story, or an outcome are all welcome.':purpose==='follow'?'Follow the experiment and see the sections shared with this invitation’s group.':'Join this collaboration group to share perspectives and follow the learning together.';
  const doc=save({doc_type:'invitation',title,body_md:body,meta:{workspace_version:1,invitation:{purpose},links:[{relation:'part_of',targets:[{document_id:uid(2)}]}]}},document_id);
  definitions.set(document_id,{document_id,revision_id:doc.revision.revision_id,purpose,title,body,description:body,image:'/api/shares/default-photo.jpg',active:true,experiment_id:uid(2),group_id,share_id,url:`/api/shares/${share_id}/preview`,members:[],history:[{id:randomUUID(),resource_type:'invitation_published',timestamp:new Date().toISOString(),actor:'sample-owner'}],responses:[]});
  shares.set(share_id,{id:share_id,document_id,title,body,description:body,image:'/api/shares/default-photo.jpg',kind:'invitation',active:true,author:'Jamie Rivers'});
 }
 const publicRoutes=[['invitation_open','GET','/api/experiment-invitations/{id}'],['invitation_join','POST','/api/experiment-invitations/{id}/accept'],['experiment_view','GET','/api/experiments/{id}/view'],['share_respond','POST','/api/shares/{id}/responses'],['share_view','GET','/api/shares/{id}'],['share_preview','GET','/api/shares/{id}/preview'],['share_follow','POST','/api/shares/{id}/follow'],['member_password_reset_request','POST','/api/auth/password-reset/request'],['member_password_reset_complete','POST','/api/auth/password-reset/complete'],['invitation_view','GET','/api/invitations/{id}'],['invitation_respond','POST','/api/invitations/{id}/respond'],['invitation_follow','POST','/api/invitations/{id}/follow'],['invitation_setup','POST','/api/invitations/{id}/setup'],['login','POST','/api/auth/login'],['logout','POST','/api/auth/logout'],['profile_json','GET','/api/profile']];
 const memberRoutes=[['invitation_close','POST','/api/experiment-invitations/experiment/{experiment}/groups/{group}/close'],['invitation_definition_list','GET','/api/experiment-invitations/experiment/{id}'],['invitation_definition_save','POST','/api/experiment-invitations/experiment/{id}'],['invitation_member_remove','DELETE','/api/experiment-invitations/experiment/{experiment}/groups/{group}/members/{person}'],['experiment_view_settings','GET','/api/experiments/{id}/visibility'],['experiment_view_publish','POST','/api/experiments/{id}/visibility'],['upload','POST','/api/upload'],['share_create','POST','/api/shares/create'],['share_current','GET','/api/shares/document/{id}'],['share_revoke','POST','/api/shares/{id}/revoke'],['member_ledger_summary','GET','/api/member/ledger-summary'],['invitation_send','POST','/api/invitations/send'],['invitation_sent','GET','/api/invitations/sent/{id}'],['content_list','GET','/api/drafts/list'],['content_document','GET','/api/drafts/document/{document_id}'],['content_get','GET','/api/drafts/get/{id}'],['content_create','POST','/api/drafts/create'],['content_update','POST','/api/drafts/update/{id}'],['content_history','GET','/api/drafts/get/{id}/history'],['content_revision','GET','/api/drafts/get/{id}/revisions/{revision_id}'],['content_restore','POST','/api/drafts/get/{id}/restore'],['content_graph','GET','/api/drafts/graph'],['content_work','GET','/api/drafts/get/{id}/work'],['content_record_work','POST','/api/drafts/get/{id}/work'],['content_work_markdown','GET','/api/drafts/get/{id}/work.md']];
 function graph(){const all=[...docs.values()];const edges=[],references=[];for(const doc of all)for(const link of doc.meta?.links||[])for(const target of link.targets){references.push({source:doc.revision.document_id,relation:link.relation,target});if(docs.has(target.document_id))edges.push({id:doc.revision.document_id+target.document_id+link.relation,from:doc.revision.document_id,to:target.document_id,relation:link.relation,source_revision_id:doc.revision.revision_id});}return {nodes:all.map(d=>({id:d.revision.document_id,title:d.title,node_type:d.doc_type,revision_id:d.revision.revision_id})),edges,references,work};}
 return {name:'raft-local-preview-api',apply:'serve',configureServer(server){server.middlewares.use(async(req,res,next)=>{
  if(!req.url?.startsWith('/api/'))return next();const url=new URL(req.url,'http://localhost');let raw='';for await(const chunk of req)raw+=chunk;
  let body={};try{body=raw?JSON.parse(raw):{};}catch{if(req.headers['content-type']?.includes('application/x-www-form-urlencoded'))body=Object.fromEntries(new URLSearchParams(raw));}
  const respond=(value,status=200,type='application/json')=>{res.statusCode=status;res.setHeader('Content-Type',type);res.setHeader('Cache-Control','no-store');res.end(type==='application/json'?JSON.stringify(value):value);};
  const preview=(item,path)=>{const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));const title=escape(item.title),description=escape(item.description||item.body),image=escape(new URL(item.image||'/api/shares/default-photo.jpg','http://'+req.headers.host).href);return respond(`<!doctype html><html><head><title>${title}</title><meta property="og:title" content="${title}"><meta property="og:description" content="${description}"><meta property="og:image" content="${image}"><meta property="og:url" content="${escape('http://'+req.headers.host+url.pathname)}"><meta property="og:type" content="website"><meta name="twitter:card" content="summary_large_image"></head><body><h1>${title}</h1><p>${description}</p><a href="${path}">Open this share</a><script>location.replace(${JSON.stringify(path)}+location.hash)</script></body></html>`,200,'text/html');};
  if(url.pathname.startsWith('/api/experiment-invitations/')){
   const parts=url.pathname.split('/');
   if(parts[3]==='experiment'){
    if(!signedIn||previewUser!==7)return respond({message:'Experiment not found'},404);
    const experiment=parts[4];
    if(parts[5]==='groups'&&parts[7]==='close'&&req.method==='POST'){const record=[...definitions.values()].find(d=>d.group_id===parts[6]&&d.experiment_id===experiment);if(!record)return respond({message:'Group not found'},404);record.active=false;shares.get(record.share_id).active=false;record.history.unshift({id:randomUUID(),resource_type:'invitation_closed',timestamp:new Date().toISOString(),actor:'sample-owner'});return respond({closed:true});}
    if(parts[5]==='groups'&&req.method==='DELETE'){const record=[...definitions.values()].find(d=>d.group_id===parts[6]&&d.experiment_id===experiment);if(!record)return respond({message:'Group not found'},404);record.members=record.members.filter(m=>m.entity_id!==parts[8]);record.blocked||=[];record.blocked.push(parts[8]);record.history.unshift({id:randomUUID(),resource_type:'group_member_removed',timestamp:new Date().toISOString(),actor:'sample-owner'});return respond({removed:true});}
    if(req.method==='GET')return respond({invitations:[...definitions.values()].filter(d=>d.experiment_id===experiment).map(d=>({...d,responses:[...responses.values()].filter(r=>r.share_id===d.share_id)}))});
    if(req.method==='POST'){
     const old=definitions.get(body.document_id);if(old&&(old.purpose!==body.purpose||old.revision_id!==body.expected_revision))return respond({message:'This invitation changed. Reload before saving.'},409);
     const doc=save({doc_type:'invitation',title:body.title,body_md:body.body,meta:{workspace_version:1,invitation:{purpose:body.purpose},links:[{relation:'part_of',targets:[{document_id:experiment}]}]}},body.document_id,old?docs.get(body.document_id):null);
     const share=old?.share_id||randomUUID(),group=old?.group_id||randomUUID();const record={...body,active:true,experiment_id:experiment,revision_id:doc.revision.revision_id,group_id:group,share_id:share,url:`/api/shares/${share}/preview`,members:old?.members||[],history:old?.history||[],blocked:old?.blocked||[]};
     record.history.unshift({id:randomUUID(),resource_type:'invitation_published',timestamp:new Date().toISOString(),actor:'sample-owner'});definitions.set(body.document_id,record);shares.set(share,{id:share,document_id:body.document_id,title:body.title,description:body.description,image:body.image,body:body.body,kind:'invitation',active:true,author:'Jamie Rivers'});return respond({document_id:body.document_id,share_id:share,group_id:group,url:record.url});
    }
   }
   const record=[...definitions.values()].find(d=>d.share_id===parts[3]);if(!record||record.active===false)return respond({message:'Invitation not found'},404);
   const joined=signedIn&&record.members.some(m=>m.user_id===previewUser);
   if(parts[4]==='accept'){
    if(!signedIn)return respond({message:'Sign in to accept'},401);
    if(previewUser===7||record.purpose==='feedback'||record.blocked?.includes('sample-person-'+previewUser))return respond({message:'This invitation cannot be accepted by this account.'},400);
    if(!joined){record.members.push({entity_id:'sample-person-'+previewUser,user_id:previewUser,name:'Sam Green',joined_at:new Date().toISOString()});record.history.unshift({id:randomUUID(),resource_type:'group_member_joined',timestamp:new Date().toISOString(),actor:'sample-person-'+previewUser});}
    return respond({status:'accepted',viewer_url:`/view/?id=${record.experiment_id}`});
   }
   return respond({id:record.share_id,title:record.title,body:record.body,description:record.description,image:record.image,sender_name:'Jamie Rivers',purpose:record.purpose,is_sender:signedIn&&previewUser===7,is_recipient:true,status:joined?'accepted':'pending',following_requested:false,response_share_id:record.purpose==='feedback'?record.share_id:null,viewer_url:joined?`/view/?id=${record.experiment_id}`:null});
  }
  if(url.pathname.startsWith('/api/experiments/')){
   const id=url.pathname.split('/')[3],action=url.pathname.split('/')[4],root=docs.get(id);if(!root||root.doc_type!=='experiment')return respond({message:'Experiment not found'},404);
   const saved=viewerSections.get(id)||[];
   if(action==='view'){const membership=[...definitions.values()].filter(d=>d.experiment_id===id&&signedIn&&d.members.some(m=>m.user_id===previewUser)).map(d=>d.group_id);const sections=saved.filter(s=>s.audience==='public'||signedIn&&previewUser===7||s.audience==='group'&&s.group_ids?.some(g=>membership.includes(g)));return sections.length||signedIn&&previewUser===7?respond({sections,is_owner:signedIn&&previewUser===7,group_access:membership.length>0,response_share_id:[...shares.values()].find(s=>s.document_id===id&&s.active)?.id}):respond({message:'No shared sections are available. Sign in if you accepted an invitation.'},404);}
   if(!signedIn||previewUser!==7)return respond({message:'Sign in to continue'},401);
   const choices=[...docs.values()].filter(d=>d.doc_type!=='brain_dump'&&(d.revision.document_id===id||d.meta?.links?.some(l=>l.relation==='part_of'&&l.targets?.some(t=>t.document_id===id))));
   if(action==='visibility'&&req.method==='GET')return respond({groups:[...definitions.values()].filter(d=>d.experiment_id===id).map(d=>({id:d.group_id,role:d.purpose,invitation_id:d.document_id})),sections:choices.map(d=>({document_id:d.revision.document_id,revision_id:d.revision.revision_id,title:d.title,body:d.body_md,doc_type:d.doc_type,audience:saved.find(s=>s.document_id===d.revision.document_id)?.audience||'private',group_ids:saved.find(s=>s.document_id===d.revision.document_id)?.group_ids||[],updated:!!saved.find(s=>s.document_id===d.revision.document_id&&s.revision_id!==d.revision.revision_id)}))});
   if(action==='visibility'&&req.method==='POST'){const selected=[];for(const input of body.sections||[]){const d=choices.find(d=>d.revision.document_id===input.document_id);if(!d||d.revision.revision_id!==input.revision_id)return respond({message:'A section changed. Reload sharing choices.'},409);if(input.audience!=='private')selected.push({document_id:d.revision.document_id,revision_id:d.revision.revision_id,title:d.title,body:d.body_md,doc_type:d.doc_type,audience:input.audience,group_ids:input.group_ids||[]});}viewerSections.set(id,selected);return respond({saved:true,url:`/view/?id=${id}`});}
  }
  if(url.pathname==='/api/shares/default-photo.jpg')return respond(readFileSync(new URL('../static/share-default.jpg',import.meta.url)),200,'image/jpeg');
  if(url.pathname.startsWith('/api/shares/')&&url.pathname!=='/api/shares/create'&&!url.pathname.startsWith('/api/shares/document/')){
   const [, , ,id,action]=url.pathname.split('/'),share=shares.get(id);if(!share?.active)return respond({message:'Share not found'},404);
   if(action==='responses'&&req.method==='POST'){if((share.kind!=='experiment'&&![...definitions.values()].some(d=>d.share_id===id&&d.purpose==='feedback'))||!['feedback','story','outcome'].includes(body.kind)||!body.body?.trim())return respond({message:'Add your experience.'},400);if(!responses.has(body.id))responses.set(body.id,{...body,share_id:id,created_at:new Date().toISOString()});return respond({received:true});}
   if(action==='preview')return preview(share,share.kind==='invitation'?`/invitations/?share=${id}`:`/shares/?id=${id}`);
   if(!action)return respond({...share,is_owner:signedIn,viewer_url:share.kind==='experiment'?`/view/?id=${share.document_id}`:null,following_requested:false,url:`/api/shares/${id}/preview`});
   if(!signedIn)return respond({message:'Sign in to continue'},401);
   if(action==='revoke'){share.active=false;return respond({});}
   if(action==='follow')return respond({following_requested:true});
  }
  if(url.pathname==='/api/config/capabilities')return respond([...publicRoutes,...signedIn?memberRoutes:[]].map(([key,method,url])=>({key,method,url,auth:!publicRoutes.some(r=>r[0]===key)})));
  if(url.pathname==='/api/profile')return respond({authenticated:signedIn,user:signedIn?{id:previewUser,display_name:previewUser===7?'Jamie Rivers':'Sam Green'}:null,roles:signedIn?['member']:[],preview:true});
  if(url.pathname==='/api/auth/login'){signedIn=true;previewUser=body.username==='guest'?8:7;return respond({message:'Signed into local preview'});}
  if(url.pathname==='/api/auth/password-reset/request')return respond({message:'Sample workspace: no email was sent. Real accounts receive a private reset link.'});
  if(url.pathname==='/api/auth/password-reset/complete')return respond({message:'Password reset links are available only for real accounts.'},400);
  if(url.pathname==='/api/auth/logout'){signedIn=false;return respond('Logged out',200,'text/plain');}
  const invitationPath=url.pathname.match(/^\/api\/invitations\/([^/]+)(?:\/(.*))?$/);
  if(invitationPath&&invitationPath[1]!=='send'&&invitationPath[1]!=='sent'){
   const invite=invitations.get(invitationPath[1]);if(!invite)return respond({message:'Invitation not found'},404);
   const action=invitationPath[2];
   if(action==='share')return preview(invite,`/invitations/?id=${invite.id}`);
   if(!action)return respond({...invite,image:invite.image||'/api/shares/default-photo.jpg',description:invite.description||invite.body,url:`/api/invitations/${invite.id}/share`,viewer_url:signedIn&&invite.status==='accepted'?`/view/?id=${invite.experiment_document}`:null,is_recipient:signedIn&&invite.recipient,is_sender:signedIn&&!invite.recipient,status:signedIn&&invite.recipient?invite.status:null});
   if(!signedIn)return respond({message:'Sign in to continue'},401);
   if(action==='follow'){invite.following_requested=true;return respond({following_requested:true});}
   if(action==='respond'&&invite.recipient){
    if(invite.status==='pending'){
     invite.status=body.action==='accept'?'accepted':'declined';
     if(body.action==='accept'){const id=randomUUID();save({doc_type:'experiment',title:body.title||invite.title,body_md:'',meta:{workspace_version:1,links:[{relation:body.relationship==='with'?'alongside':'grew_from',targets:[{document_id:uid(21),title:invite.title,invitation_id:invite.id}]}]}},id);invite.experiment_id=id;}
    }
    return respond({status:invite.status,experiment_id:invite.experiment_id});
   }
   return respond({message:'This action is unavailable in the sample workspace'},400);
  }
  if(!signedIn)return respond({message:'Sign in to continue'},401);
  if(url.pathname==='/api/upload')return respond({url:'/api/shares/default-photo.jpg'});
  if(url.pathname.startsWith('/api/shares/document/')){const doc=url.pathname.split('/').at(-1);const share=[...shares.values()].find(s=>s.document_id===doc);return respond(share?{...share,responses:[...responses.values()].filter(r=>r.share_id===share.id),followers:[],url:`/api/shares/${share.id}/preview`}:null);}
  if(url.pathname==='/api/shares/create'){const existing=[...shares.values()].find(s=>s.document_id===body.document_id);const id=existing?.id||randomUUID();shares.set(id,{...body,id,active:true,author:'Jamie Rivers',kind:docs.get(body.document_id)?.doc_type||'experiment'});return respond({id,url:`/api/shares/${id}/preview`});}
  if(url.pathname==='/api/invitations/send'){
   let invite=[...invitations.values()].find(i=>i.email===body.email&&i.document_id===body.document_id);
   if(!invite){const doc=docs.get(body.document_id),experiment=docs.get(body.experiment_id);if(!doc||!experiment)return respond({message:'Save your invitation first'},400);
    invite={id:randomUUID(),purpose:definitions.get(body.document_id)?.purpose||'collaboration',response_share_id:definitions.get(body.document_id)?.share_id,experiment_document:body.experiment_id,title:body.title||experiment.title,body:doc.body_md,sender_name:'Jamie Rivers',recipient:false,status:'pending',email:body.email,document_id:body.document_id,delivery:'sent',image:body.image,description:body.description};invitations.set(invite.id,invite);}
   return respond({id:invite.id,url:`/api/invitations/${invite.id}/share`,delivery:'sent'});
  }
  if(url.pathname.startsWith('/api/invitations/sent/'))return respond({invitations:[...invitations.values()].filter(i=>i.document_id===url.pathname.split('/').at(-1)),followers:[]});
  if(url.pathname==='/api/member/ledger-summary'){
   const counts=new Map([['person',1]]),links=new Map();
   for(const doc of docs.values())counts.set('document:'+doc.doc_type,(counts.get('document:'+doc.doc_type)||0)+1);
   const add=(source,target,relation,kind)=>{const key=[source,target,relation,kind].join('|');if(!links.has(key))links.set(key,{source,target,relation,kind,count:0});links.get(key).count++;};
   for(const edge of graph().edges){const source=docs.get(edge.from),target=docs.get(edge.to);if(source&&target)add('document:'+source.doc_type,'document:'+target.doc_type,edge.relation,'relationship');}
   for(const entry of work){const target=docs.get(entry.to_entity);if(target)add('person','document:'+target.doc_type,'work','event');}
   const all=[...links.values()];return respond({nodes:[...counts].map(([id,count])=>({id,count})),links:all,entity_count:[...counts.values()].reduce((a,b)=>a+b,0),relationship_count:all.filter(l=>l.kind==='relationship').reduce((a,l)=>a+l.count,0),event_count:all.filter(l=>l.kind==='event').reduce((a,l)=>a+l.count,0)});
  }
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
