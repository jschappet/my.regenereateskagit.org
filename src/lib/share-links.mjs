export function cleanShareUrl(raw,origin){
 const url=new URL(raw,origin);
 if(!['http:','https:'].includes(url.protocol)||url.username||url.password)throw new Error('This share link is not valid.');
 url.hash='';for(const key of [...url.searchParams.keys()])if(key!=='id')url.searchParams.delete(key);
 return url.href;
}
export function invitationText(url,title,description,kind='invitation'){
 const wording={
  invitation:['You’re invited to explore alongside me.','Read the invitation and see if you’d like to join in:'],
  collaboration:['You’re invited to collaborate on an experiment.','Read the invitation and decide whether to collaborate:'],
  follow:['You’re invited to follow this experiment.','Open the invitation to follow along:'],
  feedback:['How has this experiment affected you?','Share feedback, a story, or an outcome — no account needed:'],
  advisor:['You’re invited to offer advice on an experiment.','Read the invitation and decide whether to join as an advisor:'],
  experiment:['Take a look at this experiment’s story and impact.','Read the story and share how it affected you — feedback, a story, or an outcome:']
 };
 const [opening,closing]=wording[kind]||wording.invitation;
 return [opening,title,description,closing,url].filter(Boolean).join('\n\n');
}
export function shareDestinations(url,title,description,kind='invitation'){
 const body=invitationText(url,title,description,kind);
 return {email:`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`,sms:`sms:?body=${encodeURIComponent(body)}`};
}
