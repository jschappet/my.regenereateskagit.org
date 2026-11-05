import {test} from 'node:test';import assert from 'node:assert/strict';import {unzipSync,strFromU8} from 'fflate';
import {buildExperimentArchive,documentPaths,markdown} from '../src/lib/export.mjs';
const doc=(id,type,body='',meta={})=>({id,type,doc_type:type,title:'My '+type,body_md:body,meta,status:'draft',details:null,revision:{document_id:id,revision_id:'revision-'+id,previous_revision_id:null,revision_number:1,schema_version:1,saved_at:'2026-11-05 12:00:00'}});
test('the archive contains portable documents, relationships, private content, work, and complete history',async()=>{
 const parent=doc('parent','experiment');const interest=doc('interest','interest','Private curiosity',{links:[{relation:'part_of',targets:[{document_id:'parent'}]}],custom:{keep:true}});
 interest.details='{"brain_dump":"Still private"}';
 const calls=[];const client={has:async()=>true,call:async(key,params)=>{calls.push({key,params});if(key==='content_history')return [{revision_id:'old',revision_number:1}];if(key==='content_revision')return {...(params.id==='parent'?parent:interest),body_md:'Earlier writing',revision:{...(params.id==='parent'?parent:interest).revision,revision_id:'old'}};return '# Work log\n\nGathered materials.';}};
 const result=await buildExperimentArchive({parent,documents:[parent,interest],client,origin:'https://my.example.org',history:true});
 const files=unzipSync(result.bytes);const text=strFromU8(files['interest.md']);
 assert.match(text,/Private curiosity/);assert.match(text,/Still private/);assert.match(text,/"document_id": "interest"/);
 assert.match(text,/"path":"experiment.md"/);assert.match(text,/"custom": \{"keep":true\}/);
 assert.ok(files['work-log.md']);assert.ok(files['history/interest/0001-old.md']);
 assert.match(strFromU8(files['history/interest/0001-old.md']),/"path":"..\/..\/experiment.md"/);
 assert.match(strFromU8(files['history/interest/0001-old.md']),/Earlier writing/);
 assert.equal(JSON.parse(strFromU8(files['export.json'])).documents.length,2);
});
test('linked same-origin attachments are bundled and rewritten, including relative Markdown image paths',async()=>{
 const parent=doc('parent','experiment','![Soil](uploads/soil.png)',{images:[{url:'/uploads/soil.png',alt:'Soil'}]});
 const result=await buildExperimentArchive({parent,documents:[parent],client:{has:async()=>false},origin:'https://my.example.org',fetchAttachment:async url=>{assert.equal(url,'https://my.example.org/uploads/soil.png');return new Response(new Uint8Array([1,2,3]));}});
 const files=unzipSync(result.bytes),body=strFromU8(files['experiment.md']);
 assert.deepEqual([...files['attachments/001-soil.png']],[1,2,3]);
 assert.match(body,/!\[Soil\]\(attachments\/001-soil.png\)/);assert.match(body,/"url":"attachments\/001-soil.png"/);
});
test('an unavailable attachment fails the export instead of silently producing an incomplete archive',async()=>{
 const parent=doc('parent','experiment','![Soil](/uploads/soil.png)');
 await assert.rejects(buildExperimentArchive({parent,documents:[parent],client:{has:async()=>false},origin:'https://my.example.org',fetchAttachment:async()=>new Response(null,{status:404})}),/Nothing has been exported/);
});
test('filenames are generated from types and IDs, and external document references stay intact',()=>{
 const parent=doc('parent','experiment');const a=doc('aaaaaaaa-1','interest'),b=doc('bbbbbbbb-2','interest');
 const paths=documentPaths(parent,[parent,a,b]);assert.notEqual(paths.get(a.revision.document_id),paths.get(b.revision.document_id));
 const story=doc('story','story','My story',{links:[{relation:'grew_from',targets:[{document_id:'outside',path:'../../another-project.md',title:'Another project'}]}]});
 const text=markdown(story,paths);assert.match(text,/"document_id":"outside"/);assert.match(text,/another-project.md/);assert.ok(!text.includes('undefined'));
});

test('external attachments stay references with an explicit archive warning',async()=>{
 const parent=doc('parent','experiment','![Elsewhere](https://example.org/photo.jpg)');
 const result=await buildExperimentArchive({parent,documents:[parent],client:{has:async()=>false},origin:'https://my.example.org',fetchAttachment:()=>{throw new Error('External URLs must not be fetched');}});
 const files=unzipSync(result.bytes);assert.equal(result.warnings.length,1);assert.match(strFromU8(files['README.md']),/References not downloaded/);assert.match(strFromU8(files['experiment.md']),/https:\/\/example.org\/photo.jpg/);
});
