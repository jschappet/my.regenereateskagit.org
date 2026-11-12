import test from 'node:test';
import assert from 'node:assert/strict';
import {experimentConnections} from '../src/lib/ledger-graph.mjs';

const graph={
 nodes:[
  {id:'experiment',node_type:'experiment',revision_id:'r1'},
  {id:'followup',node_type:'experiment',revision_id:'r5'},
  {id:'independent',node_type:'experiment',revision_id:'r2'},
  {id:'interest',node_type:'interest',revision_id:'r3'},
  {id:'story',node_type:'story',revision_id:'r4'},
 ],
 edges:[
  {from:'followup',to:'experiment',relation:'grew_from'},
  {from:'experiment',to:'interest',relation:'grew_from'},
  {from:'story',to:'experiment',relation:'part_of'},
  {from:'story',to:'interest',relation:'related_to'},
 ],
 references:[
  {source:'experiment',relation:'grew_from',target:{document_id:'original',invitation_id:'accepted'}},
  {source:'experiment',relation:'grew_from',target:{document_id:'private'}},
 ],
};

test('the ledger shows named experiments and their recorded connections',()=>{
 const result=experimentConnections(graph);
 assert.deepEqual(result.nodes.map(node=>node.id),['experiment','followup','independent','interest','story','original']);
 assert.deepEqual(result.links.map(link=>[link.source,link.target,link.relation]),[
  ['followup','experiment','grew_from'],
  ['experiment','interest','grew_from'],
  ['story','experiment','part_of'],
  ['experiment','original','grew_from'],
 ]);
});

test('focusing an experiment includes both directions and keeps isolated experiments visible',()=>{
 assert.equal(experimentConnections(graph,'experiment').links.length,4);
 const isolated=experimentConnections(graph,'independent');
 assert.deepEqual(isolated.nodes.map(node=>node.id),['independent']);
 assert.deepEqual(isolated.links,[]);
});

test('chart counts are attached only to owned experiments, including those with zero feedback',()=>{
 const result=experimentConnections({...graph,feedback_counts:{experiment:3}});
 assert.deepEqual(result.nodes.map(node=>[node.id,node.feedbackCount]),[
  ['experiment',3],['followup',0],['independent',0],['interest',undefined],
  ['story',undefined],['original',undefined],
 ]);
});
