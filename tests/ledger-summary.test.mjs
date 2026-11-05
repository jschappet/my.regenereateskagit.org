import test from 'node:test';import assert from 'node:assert/strict';import {filterSummary} from '../src/lib/ledger-graph.mjs';
test('summary filtering preserves aggregate counts and restricts links to the selected category and kind',()=>{
 const summary={nodes:[{id:'person',count:9},{id:'document:experiment',count:10},{id:'document:interest',count:4}],links:[{source:'person',target:'document:experiment',kind:'event',relation:'work',count:8},{source:'document:experiment',target:'document:interest',kind:'relationship',relation:'grew_from',count:4}]};
 const result=filterSummary(summary,'relationship','document:interest');assert.equal(result.links.length,1);assert.equal(result.links[0].count,4);assert.deepEqual(result.nodes.map(n=>n.id),['document:experiment','document:interest']);assert.equal(summary.links[0].source,'person');
});
