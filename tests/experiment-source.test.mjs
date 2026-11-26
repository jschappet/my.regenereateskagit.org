import test from 'node:test';
import assert from 'node:assert/strict';
import {sourceDocument,sourceLink} from '../src/lib/experiment-source.mjs';
import {referenceUrl} from '../src/lib/document-links.mjs';

const experiment={doc_type:'experiment',revision:{document_id:'experiment'},meta:{}};
const action={doc_type:'act',revision:{document_id:'action'},meta:{
 links:[{relation:'part_of',targets:[{document_id:'experiment'}]}],
}};
const idea={doc_type:'idea',revision:{document_id:'idea'},meta:{}};
const documents=[experiment,action,idea];
const page=path=>new URL(path,'https://workspace.example');

test('creation defaults to the current document or the specific action in an experiment',()=>{
 assert.equal(sourceDocument(page('/documents/?id=idea'),documents),idea);
 assert.equal(sourceDocument(page('/experiments/?id=experiment'),documents),experiment);
 assert.equal(sourceDocument(page('/experiments/?id=experiment&step=act&draft=action'),documents),action);
 assert.equal(sourceDocument(page('/experiments/?id=experiment&draft=idea'),documents),experiment);
 assert.equal(sourceDocument(page('/library/?id=idea'),documents),undefined);
});

test('an action or an external URL is recorded as the source of the experiment',()=>{
 const target={document_id:'shared-action',title:'An action',viewer_id:'original-experiment'};
 assert.deepEqual(sourceLink(target,''),[{relation:'grew_from',targets:[target]}]);
 assert.equal(referenceUrl(target,documents),'/view/?id=original-experiment#section-shared-action');
 assert.deepEqual(sourceLink(undefined,' https://example.org/field-notes '),[
  {relation:'grew_from',targets:[{url:'https://example.org/field-notes'}]},
 ]);
 for(const url of ['', 'example.org', 'javascript:alert(1)', 'https://name:secret@example.org/']){
  assert.throws(()=>sourceLink(undefined,url));
 }
});
