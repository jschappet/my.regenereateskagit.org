export function canonical(value){
 if(Array.isArray(value))return value.map(canonical);
 if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])]));
 return value;
}
export function sameContent(draft,payload){return draft.doc_type===payload.doc_type&&draft.title===payload.title&&draft.body_md===payload.body_md&&JSON.stringify(canonical(draft.meta))===JSON.stringify(canonical(payload.meta))&&(draft.details??null)===(payload.details??null);}
