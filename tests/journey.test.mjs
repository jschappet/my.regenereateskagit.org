import {test} from 'node:test';import assert from 'node:assert/strict';
import {steps,parseSections,composeSections,experimentDocuments,startReadiness} from '../src/lib/journey.mjs';
import {sameContent,draftTags,explicitTags,normalizeTags} from '../src/lib/content.mjs';
const doc=(id,type,meta={})=>({doc_type:type,meta,revision:{document_id:id}});
const child=(id,type,meta={})=>doc(id,type,{...meta,links:[{relation:'part_of',targets:[{document_id:'parent'}]}]});
test('each journey step is its own draft type, with the start after invitations and scheduling',()=>{
 assert.equal(steps.length,11);assert.equal(new Set(steps.map(s=>s.type)).size,11);
 assert.equal(steps[2].type,'invitation');assert.equal(steps[5].type,'experiment_start');
});
test('guided notes remain readable Markdown and preserve unrecognized sections and fenced content',()=>{
 const fields=[['Interest'],['Why it matters']];const original='## Interest\n\nSoil\n\n```md\n## Not a real heading\n```\n\n## Why it matters\n\nMy garden.\n\n## Extra notes\n\nKeep this too.';
 const parsed=parseSections(original,fields);assert.match(parsed.values.Interest,/Not a real heading/);
 const output=composeSections(fields,parsed.values,parsed.extra);assert.equal(output,original);
 assert.equal(parseSections('An older freeform note.',fields).values.Interest,'An older freeform note.');
});
test('experiment folders include their own steps and source interest, not other experiments or partners',()=>{
 const parent=doc('parent','experiment',{links:[{relation:'grew_from',targets:[{document_id:'interest'},{document_id:'inspiration'}]},{relation:'coworked_with',targets:[{document_id:'partner'}]}]});
 const all=[parent,doc('interest','interest'),doc('inspiration','experiment'),doc('partner','experiment'),child('action','action'),doc('unrelated','idea')];
 assert.deepEqual(experimentDocuments(parent,all).map(d=>d.revision.document_id),['interest','action']);
});
test('the clock waits for an explicit participation decision and two ordered meeting dates',()=>{
 const parent=doc('parent','experiment');assert.match(startReadiness(parent,[]),/partner arrangement/);
 const company=child('company','participation',{participation:{mode:'partner',agreed:false}});
 assert.match(startReadiness(parent,[company]),/agreed/);company.meta.participation.agreed=true;
 const meetings=child('meetings','meeting_plan',{schedule:{week_one:'2026-11-12T10:00:00Z',week_two:'2026-11-19T10:00:00Z'}});
 assert.equal(startReadiness(parent,[company,meetings]),'');
 company.meta.participation={mode:'solo'};assert.equal(startReadiness(parent,[company,meetings]),'');
 meetings.meta.schedule.week_two=meetings.meta.schedule.week_one;assert.match(startReadiness(parent,[company,meetings]),/both review dates/);
});
test('creation retries compare actual content without depending on JSON object key order',()=>{
 const payload={doc_type:'idea',title:'Seeds',body_md:'A thought',meta:{b:2,a:{y:2,x:1}}};
 assert.ok(sameContent({...payload,meta:{a:{x:1,y:2},b:2},details:null},payload));
 assert.ok(!sameContent({...payload,body_md:'Someone else’s version'},payload));
});

test('draft tagging keeps Markdown tags out of the explicit save payload',()=>{
 const tags=JSON.stringify(normalizeTags(['Food','#Community','FOOD']));
 const payload={doc_type:'idea',title:'Seeds',body_md:'Try #compost',meta:{},tags};
 const draft={...payload,explicit_tags:['community','food'],tag_names:['community','compost','food']};
 assert.deepEqual(explicitTags(draft),['community','food']);
 assert.deepEqual(draftTags(draft),['community','compost','food']);
 assert.deepEqual(draftTags({tags:'Food',meta:{tags:' #Community '}}),['community','food']);
 assert.ok(sameContent(draft,payload));
 assert.ok(!sameContent(draft,{...payload,tags:JSON.stringify(['food'])}));
});
