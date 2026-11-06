import test from 'node:test';import assert from 'node:assert/strict';import {cleanShareUrl,shareDestinations,invitationText} from '../src/lib/share-links.mjs';import {describeMarkdown} from '../src/lib/markdown.mjs';
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

test('invitation text matches the sharing purpose and includes the public description and link',()=>{
 const url=cleanShareUrl('/api/shares/public/preview#setup=secret','https://example.org');
 const invite=invitationText(url,'Garden','Join us for a conversation.','invitation');
 const story=invitationText(url,'Garden','What we learned in the garden.','experiment');
 assert.match(invite,/invited to explore alongside me/);
 assert.match(invite,/Join us for a conversation/);
 assert.match(story,/story and impact/);
 assert.match(story,/share how it affected you/);
 assert.ok(!story.includes('join in'));
 for(const text of [invite,story]){assert.ok(text.endsWith(url));assert.ok(!text.includes('secret'));}
 assert.equal(new URLSearchParams(shareDestinations(url,'Garden','Description','experiment').sms.split('?')[1]).get('body'),invitationText(url,'Garden','Description','experiment'));
});

test('invitation copy matches role actions without promising editing or ownership',()=>{
 const url='https://example.org/invitation';
 assert.match(invitationText(url,'Garden','An invitation','feedback'),/no account needed/);
 assert.match(invitationText(url,'Garden','An invitation','follow'),/follow along/);
 assert.match(invitationText(url,'Garden','An invitation','collaboration'),/decide whether to collaborate/);
 assert.match(invitationText(url,'Garden','An invitation','advisor'),/join as an advisor/);
 for(const role of ['follow','collaboration','advisor'])assert.doesNotMatch(invitationText(url,'Garden','An invitation',role),/editing|ownership/);
});
