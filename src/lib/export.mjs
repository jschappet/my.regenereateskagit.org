import {strToU8,zipSync} from 'fflate';
import {experimentDocuments,labels} from './journey.mjs';

export function slug(text){return text.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,72)||'experiment';}
export function bundleDocuments(parent,all){return [parent,...experimentDocuments(parent,all)].filter((d,i,a)=>a.findIndex(x=>x.revision.document_id===d.revision.document_id)===i);}
export function documentPaths(parent,docs){
 const paths=new Map([[parent.revision.document_id,'experiment.md']]);
 for(const doc of docs){if(doc.revision.document_id===parent.revision.document_id)continue;
  const base=doc.doc_type.replace(/_/g,'-');
  const same=docs.filter(d=>d.doc_type===doc.doc_type&&d.revision.document_id!==parent.revision.document_id);
  paths.set(doc.revision.document_id,`${base}${same.length>1?'-'+doc.revision.document_id.slice(0,8):''}.md`);
 }return paths;
}
export function markdown(doc,paths,prefix='',rewrite=text=>text){
 const links=(doc.meta?.links??[]).map(link=>({...link,targets:link.targets.map(target=>{
  const path=paths.get(target.document_id);return path?{...target,path:prefix+path,title:target.title||target.document_id}:target;
 })}));
 let privateWorkspace=doc.details??null;try{privateWorkspace=JSON.parse(privateWorkspace);}catch{}
 const {links:_,...meta}=doc.meta??{};
 const record={...meta,document_id:doc.revision.document_id,revision_id:doc.revision.revision_id,
  previous_revision_id:doc.revision.previous_revision_id,schema_version:doc.revision.schema_version,
  type:doc.doc_type,title:doc.title,author:doc.author??'',status:doc.status,revision_number:doc.revision.revision_number,saved_at:doc.revision.saved_at,access_scope:'private',links,
  ...(privateWorkspace?{private_workspace:privateWorkspace}:{})};
 const header=Object.entries(record).map(([k,v])=>`${JSON.stringify(k)}: ${JSON.stringify(v??null)}`).join('\n');
 const body=rewrite(doc.body_md??'');
 const readableLinks=links.flatMap(l=>l.targets.map(t=>{
  const target=t.document_id&&paths.has(t.document_id)?prefix+paths.get(t.document_id):t.url;
  return target?`- ${l.relation.replace(/_/g,' ')}: [${String(t.title||t.document_id||t.url).replace(/[\[\]]/g,'')}](${target})`:'';
 })).filter(Boolean).join('\n');
 return `---\n${header}\n---\n\n# ${doc.title}\n\n${body}${readableLinks?'\n\n## Connections\n\n'+readableLinks:''}\n`;
}
function attachmentUrls(doc,origin,warnings){
 const strings=[];function visit(value){if(typeof value==='string')strings.push(value);else if(Array.isArray(value))value.forEach(visit);else if(value&&typeof value==='object')Object.values(value).forEach(visit);}
 visit(doc.meta?.attachments);visit(doc.meta?.images);
 for(const match of (doc.body_md??'').matchAll(/!\[[^\]]*\]\(([^\s)]+)(?:\s+[^)]*)?\)/g))strings.push(match[1]);
 const urls=[];
 for(const value of strings){try{const url=new URL(value,origin);if(url.origin===origin&&['/uploads/','/assets/'].some(p=>url.pathname.startsWith(p)))urls.push(url.href);else if(/^(?:https?:|[./]|uploads\/|assets\/)/.test(value))warnings.push(`Attachment remains an external reference: ${value}`);}catch{}}
 return [...new Set(urls)];
}
export async function buildExperimentArchive({parent,documents,client,history=false,origin,fetchAttachment=fetch,onProgress=(_message)=>{}}){
 const docs=bundleDocuments(parent,documents),paths=documentPaths(parent,docs),files={},warnings=[];
 const snapshots=[];
 for(const doc of docs){onProgress(`Collecting ${labels[doc.doc_type]||doc.doc_type}…`);snapshots.push({doc,path:paths.get(doc.revision.document_id),prefix:''});
  if(history){const versions=await client.call('content_history',{id:doc.id});
   for(const revision of versions??[]){const old=await client.call('content_revision',{id:doc.id,revision_id:revision.revision_id});if(!old)throw new Error('A historical revision could not be loaded.');
    snapshots.push({doc:old,path:`history/${paths.get(doc.revision.document_id).replace('.md','')}/${String(revision.revision_number).padStart(4,'0')}-${revision.revision_id}.md`,prefix:'../../'});
   }
  }
 }
 const assets=new Map();
 for(const {doc} of snapshots)for(const url of attachmentUrls(doc,origin,warnings))if(!assets.has(url)){
  let filename=new URL(url).pathname.split('/').pop()||'file';try{filename=decodeURIComponent(filename);}catch{}filename=filename.replace(/[^a-zA-Z0-9._-]/g,'_').slice(0,128);
  const path=`attachments/${String(assets.size+1).padStart(3,'0')}-${filename}`;
  assets.set(url,path);onProgress(`Collecting attachment ${assets.size}…`);
  const response=await fetchAttachment(url,{credentials:'same-origin'});
  if(!response.ok)throw new Error(`An attachment could not be downloaded (${response.status}). Nothing has been exported.`);
  files[path]=new Uint8Array(await response.arrayBuffer());
 }
 for(const {doc,path,prefix} of snapshots){
  const rewrite=text=>{text=text.replace(/(!\[[^\]]*\]\()([^\s)]+)([^)]*\))/g,(match,start,url,end)=>{try{const found=assets.get(new URL(url,origin).href);return found?start+prefix+found+end:match;}catch{return match;}});for(const [url,local] of assets){text=text.split(url).join(prefix+local);const relative=new URL(url).pathname;text=text.split(relative).join(prefix+local);}return text;};
  // Rewrite attachment URLs in structured metadata as well as the readable body.
  const portable=JSON.parse(JSON.stringify(doc),(key,value)=>{
   if(typeof value!=='string')return value;try{const found=assets.get(new URL(value,origin).href);if(found)return prefix+found;}catch{}return value;
  });
  files[path]=strToU8(markdown(portable,paths,prefix,rewrite));
 }
 if(await client.has('content_work_markdown'))for(const doc of docs){
  onProgress('Collecting work records…');const log=await client.call('content_work_markdown',{id:doc.id});
  if(log)files[doc===parent?'work-log.md':`work/${paths.get(doc.revision.document_id)}`]=strToU8(log);
 }
 files['README.md']=strToU8(`# ${parent.title}\n\nThis is your private RAFT experiment archive. Start with [experiment.md](experiment.md).\n\nEach Markdown document includes its permanent ID, saved revision, and relationships in YAML frontmatter. Files can be read and edited without Heron. Links to documents outside this folder remain as permanent references.\n\n${history?'The history folder contains complete saved revisions.\n\n':''}Attachments are stored locally in attachments/. Sharing this folder shares its private contents.\n${warnings.length?'\n## References not downloaded\n\n'+[...new Set(warnings)].map(w=>'- '+w).join('\n')+'\n':''}`);
 files['export.json']=strToU8(JSON.stringify({schema_version:1,exported_at:new Date().toISOString(),experiment_id:parent.revision.document_id,documents:docs.map(d=>({document_id:d.revision.document_id,path:paths.get(d.revision.document_id),revision_id:d.revision.revision_id})),history,attachments:[...assets.values()],warnings},null,2));
 onProgress('Preparing your folder…');
 return {warnings:[...new Set(warnings)],bytes:zipSync(files,{level:6}),filename:`${slug(parent.title)}.zip`,files:Object.keys(files)};
}
