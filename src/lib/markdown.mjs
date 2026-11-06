import MarkdownIt from 'markdown-it';

// Invitation authors can use Markdown, but cannot supply HTML or executable URLs.
const markdown = new MarkdownIt({html:false,breaks:true});
export function renderMarkdown(source){return markdown.render(source||'');}
export function describeMarkdown(source,limit=240){
 const tokens=markdown.parse(source||'',{});
 const text=tokens.filter((token,index)=>token.type==='inline'&&tokens[index-1]?.type==='paragraph_open').map(token=>(token.children||[]).filter(t=>['text','code_inline','softbreak','hardbreak'].includes(t.type)).map(t=>t.type.endsWith('break')?' ':t.content).join('')).join(' ').replace(/\s+/g,' ').trim();
 return text.length>limit?text.slice(0,limit-1).trimEnd()+'…':text;
}
