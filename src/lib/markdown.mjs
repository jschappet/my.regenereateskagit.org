import MarkdownIt from 'markdown-it';

// Invitation authors can use Markdown, but cannot supply HTML or executable URLs.
const markdown = new MarkdownIt({html:false,breaks:true});
export function renderMarkdown(source){return markdown.render(source||'');}
