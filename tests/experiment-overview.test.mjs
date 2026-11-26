import test from 'node:test';
import assert from 'node:assert/strict';
import {experimentLineage,experimentOverviewStages} from '../src/lib/experiment-overview.mjs';

const draft=(id,doc_type,links=[])=>({revision:{document_id:id},doc_type,title:id,meta:{links}});
const link=(relation,document_id)=>({relation,targets:[{document_id}]});

test('the overview preserves workflow order and includes all actions and linked stories',()=>{
 const experiment=draft('experiment','experiment');
 experiment.meta.workflow_version=2;
 const brainstorm=draft('brainstorm','brainstorm',[link('part_of','experiment')]);
 const action=draft('action','act',[link('part_of','experiment')]);
 const second=draft('second','act',[link('part_of','experiment')]);
 const story=draft('story','story',[link('reports_on','experiment')]);
 const other=draft('unrelated','story');
 const stages=experimentOverviewStages(experiment,[other,story,brainstorm,action,experiment,second]);
 assert.deepEqual(stages.map(stage=>stage.label),['Act','Story So Far']);
 assert.deepEqual(stages[0].drafts,[brainstorm,action,second]);
 assert.deepEqual(stages[1].drafts,[story]);
});

test('the tree follows ideas, nested experiments and action origins without looping',()=>{
 const idea=draft('idea','idea',[link('grew_from','second')]);
 const first=draft('first','experiment',[link('grew_from','idea')]);
 const action=draft('action','act',[link('part_of','first')]);
 const second=draft('second','experiment',[link('grew_from','action')]);
 const third=draft('third','experiment',[link('grew_from','second')]);
 const docs=[idea,first,action,second,third];
 const {ancestors,descendants}=experimentLineage(second,docs);
 assert.equal(ancestors[0].id,'first');
 assert.equal(ancestors[0].href,'/experiments/?id=first&read=1');
 assert.equal(ancestors[0].via,'action');
 assert.equal(ancestors[0].children[0].id,'idea');
 assert.deepEqual(ancestors[0].children[0].children,[]);
 assert.ok(descendants.some(node=>node.id==='third'));
});
