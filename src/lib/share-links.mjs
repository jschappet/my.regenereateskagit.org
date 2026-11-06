export function cleanShareUrl(raw,origin){
 const url=new URL(raw,origin);
 if(!['http:','https:'].includes(url.protocol)||url.username||url.password)throw new Error('This share link is not valid.');
 url.hash='';for(const key of [...url.searchParams.keys()])if(key!=='id')url.searchParams.delete(key);
 return url.href;
}
export function shareDestinations(url,title,description){
 const body=[title,description,url].filter(Boolean).join('\n\n');
 return {email:`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`,sms:`sms:?body=${encodeURIComponent(body)}`};
}
