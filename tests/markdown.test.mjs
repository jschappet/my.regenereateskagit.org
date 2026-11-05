import test from 'node:test';
import assert from 'node:assert/strict';
import {renderMarkdown} from '../src/lib/markdown.mjs';

test('invitations render headings, emphasis, lists, and links as HTML',()=>{
 const html=renderMarkdown('## Join me\n\nExplore **together** with *curiosity*.\n\n- First conversation\n- Second conversation\n\n[Read more](https://example.org)');
 assert.match(html,/<h2>Join me<\/h2>/);
 assert.match(html,/<strong>together<\/strong>/);
 assert.match(html,/<em>curiosity<\/em>/);
 assert.match(html,/<ul>\n<li>First conversation<\/li>/);
 assert.match(html,/<a href="https:\/\/example.org">Read more<\/a>/);
});
test('invitation Markdown cannot introduce scripts, event handlers, or executable links',()=>{
 const html=renderMarkdown('<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>\n\n[click](javascript:alert(1))');
 assert.doesNotMatch(html,/<script|<img|href="javascript:/i);
 assert.match(html,/&lt;script&gt;/);
});
