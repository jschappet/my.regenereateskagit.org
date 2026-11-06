import test from 'node:test';import assert from 'node:assert/strict';import {cleanShareUrl,shareDestinations} from '../src/lib/share-links.mjs';import {describeMarkdown} from '../src/lib/markdown.mjs';
test('copied links never include account setup or reset credentials',()=>{
 assert.equal(cleanShareUrl('/api/invitations/public/share#setup=secret','https://my.regenerateskagit.org'),'https://my.regenerateskagit.org/api/invitations/public/share');
 assert.equal(cleanShareUrl('/invitations/?id=public&token=secret&setup=secret#token=private','https://my.regenerateskagit.org'),'https://my.regenerateskagit.org/invitations/?id=public');
 assert.throws(()=>cleanShareUrl('javascript:alert(1)','https://example.org'));
});
test('text and email links carry the public URL, title, and description',()=>{
 const result=shareDestinations('https://example.org/share','Try a garden experiment','Join me for two short conversations.');
 assert.match(result.email,/^mailto:\?subject=Try/);assert.match(decodeURIComponent(result.email),/https:\/\/example.org\/share/);assert.match(decodeURIComponent(result.sms),/two short conversations/);
});
test('preview descriptions use prose without markdown headings or link syntax',()=>{
 assert.equal(describeMarkdown('## Invitation\n\nExplore **together**. [Visit the garden](https://example.org).'),'Explore together. Visit the garden.');
 assert.ok(describeMarkdown('A '.repeat(300)).length<=240);
});
