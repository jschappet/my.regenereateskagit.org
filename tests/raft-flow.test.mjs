import {test} from 'node:test';
import assert from 'node:assert/strict';
import {raftSteps,storyPrompts,brainstormJobs,publicStory,mapKey,isMapCopy} from '../src/lib/raft-flow.mjs';

test('the visible RAFT flow retains the existing draft types',()=>{
 assert.deepEqual(raftSteps.map(step=>step.type),[
  'interest','brain_dump','experiment_start','invitation','exploration',
  'meeting_plan','action','reflection','story','submission',
 ]);
});

test('brainstorm choices include Markdown bullets and legacy checkbox bullets',()=>{
 assert.deepEqual(brainstormJobs('Private notes\n- Ask a neighbor\n- [x] Take photos\n- Ask a neighbor'),[
  'Ask a neighbor','Take photos',
 ]);
});

test('the public story includes all six responses and retains older freeform stories',()=>{
 const body=storyPrompts.map(([question],i)=>`## ${i+1}. ${question}\n\nAnswer ${i+1}`).join('\n\n');
 assert.deepEqual(publicStory(body),{
  exploration:'Answer 1',happened:'Answer 2',takeaway:'Answer 3\n\nAnswer 4\n\nAnswer 5\n\nAnswer 6',
 });
 assert.equal(publicStory('An existing story.').happened,'An existing story.');
 assert.ok(isMapCopy({doc_type:'experiment',meta:{journey_version:1,experiment_id:mapKey('parent')}}));
 assert.ok(!isMapCopy({doc_type:'experiment',meta:{journey_version:1,experiment_id:'parent'}}));
});
