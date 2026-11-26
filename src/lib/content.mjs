export function canonical(value){
 if(Array.isArray(value))return value.map(canonical);
 if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])]));
 return value;
}
export function normalizeTag(tag){return tag.trim().replace(/^#+/, '').trim().toLowerCase();}
export function normalizeTags(tags){
 return [...new Set(tags.filter(tag=>typeof tag==='string').map(normalizeTag).filter(Boolean))].sort();
}
function parseTags(value){
 if(Array.isArray(value))return value;
 if(typeof value!=='string')return [];
 try{const parsed=JSON.parse(value);if(Array.isArray(parsed))return parsed;}catch{}
 return value.split(',');
}
export function explicitTags(draft){
 return draft.explicit_tags??normalizeTags([...parseTags(draft.tags),...parseTags(draft.meta?.tags)]);
}
/** @returns {string[]} */
export function draftTags(draft){return draft.tag_names??explicitTags(draft);}
export function sameContent(draft,payload){
 return draft.doc_type===payload.doc_type&&draft.title===payload.title&&draft.body_md===payload.body_md
  &&JSON.stringify(canonical(draft.meta))===JSON.stringify(canonical(payload.meta))
  &&(draft.details??null)===(payload.details??null)
  &&(payload.tags===undefined||JSON.stringify(normalizeTags(explicitTags(draft)))===JSON.stringify(normalizeTags(parseTags(payload.tags))));
}
