import test from 'node:test';import assert from 'node:assert/strict';
import {documentUrl,referenceUrl} from '../src/lib/document-links.mjs';
const documents=[{doc_type:'experiment',revision:{document_id:'experiment'},meta:{}},{doc_type:'invitation',revision:{document_id:'notes'},meta:{links:[{relation:'part_of',targets:[{document_id:'experiment'}]}]}},{doc_type:'idea',revision:{document_id:'idea'},meta:{}}];
test('document links open experiments, journey steps, and standalone documents in the right editor',()=>{
 assert.equal(documentUrl('experiment',documents),'/experiments/?id=experiment');assert.equal(documentUrl('notes',documents),'/experiments/?id=experiment&step=invitation');assert.equal(documentUrl('idea',documents),'/documents/?id=idea');
});
test('private original experiments resolve through their public invitation without granting document access',()=>{
 assert.equal(referenceUrl({document_id:'private',invitation_id:'public-link'},documents),'/invitations/?id=public-link');assert.equal(referenceUrl({document_id:'private'},documents),null);
 assert.equal(referenceUrl({url:'javascript:alert(1)'},documents),null);assert.equal(referenceUrl({url:'https://example.org/source'},documents),'https://example.org/source');
});
