export const steps = [
 {key:'interest',type:'interest',label:'Find an interest',short:'Interest',intro:'Start with what has your attention. A question, a hunch, or a “what if” is enough.',fields:[['Interest','What’s got your attention?','A sentence is a good beginning.'],['Why it matters','What draws you to it?','What lights you up about this?']]},
 {key:'brain_dump',type:'brain_dump',label:'Private brain dump',short:'Brain dump',intro:'Give your thoughts some room. Then choose one small thing you might explore.',fields:[['Brain dump','What comes to mind?','Questions, people, materials, wild ideas, and things that might get in the way.'],['Chosen experiment','What small piece would you like to explore?','Your interest can be big. Your experiment can be small.'],['Hope','What do you hope to learn or feel?',''],['Needs','What might you need?','People, places, supplies, skills, time, or help.']]},
 {key:'invitation',type:'invitation',label:'Make an invitation',short:'Invitation',intro:'Invite someone to explore alongside you, or share your experiment’s story and impact. Choose what you’d like people to see and how you’d like to connect.',fields:[['Invitation','What would you like to invite someone into?','Describe your interest and the two short presentation meetings.']]},
 {key:'participation',type:'participation',label:'Choose your company',short:'Company',intro:'Confirm the arrangement with your presentation partner, or decide to go through the process on your own.',fields:[['Arrangement','What have you agreed together?','Each of you keeps your own project.']]},
 {key:'meeting_plan',type:'meeting_plan',label:'Set your meeting dates',short:'Meeting dates',intro:'Make space for two short presentations and Q&A: one after preparation, and another after action.',fields:[['Meeting details','How will you meet?','A place, a meeting link, and anything you want to remember.']]},
 {key:'experiment_start',type:'experiment_start',label:'Start the clock',short:'Start',intro:'Your two weeks begin when you choose to start, based on the meeting schedule you’ve agreed.',fields:[['Starting intention','What are you bringing into these two weeks?','']]},
 {key:'exploration',type:'exploration',label:'Explore, prepare, and present',short:'Explore & prepare',intro:'Gather data, research, materials, and make the calls you need for your action. Share your discoveries and intentions at your first meeting.',fields:[['Research and preparation','What are you finding out?','Keep notes as you go.'],['Findings and intentions','What will you present?','What have you learned, and what small action will you try?'],['Questions and answers','What came up in the conversation?','']]},
 {key:'action',type:'action',label:'Move toward action',short:'Take action',intro:'Try your small experiment. Notice what happens, what changes, and how the experience feels.',fields:[['Action','What did you try?','Or what kept you from trying it?'],['Observations','What are you noticing?','Surprises, obstacles, changes of direction, and feelings.']]},
 {key:'reflection',type:'reflection',label:'Celebrate and reflect',short:'Celebrate & reflect',intro:'Meet with your partner, share your findings, ask questions, and celebrate the attention you gave your experiment.',fields:[['Findings','What happened?',''],['Conversation','What came up when you shared it?',''],['Reflection','What are you taking away?','Celebrate something, however small.']]},
 {key:'story',type:'story',label:'Tell your story',short:'Story',intro:'Connect your original curiosity with what you experienced and what it means to you now.',fields:[['Story','Your story','Write in your own words. You can keep coming back to it.']]},
 {key:'submission',type:'submission',label:'Review your story',short:'Review',intro:'Read through your story and decide what you’re comfortable sharing. Your work stays private until you explicitly share it.',fields:[['Review notes','Anything you want to revise or remember?','You can export your experiment at any point.']]}
];
export const labels = Object.fromEntries(steps.map(s=>[s.type,s.short]));
labels.experiment='Experiment';labels.idea='Idea';
export function linksTo(draft,id,relations=['part_of','reports_on']) {
 return (draft.meta?.links??[]).some(l=>relations.includes(l.relation)&&l.targets.some(t=>t.document_id===id));
}
export function experimentDocuments(parent,all) {
 const id=parent.revision.document_id;
 const interests=new Set((parent.meta?.links??[]).filter(l=>l.relation==='grew_from').flatMap(l=>l.targets.map(t=>t.document_id)));
 return all.filter(d=>d.revision.document_id!==id&&(linksTo(d,id)||(['interest','idea'].includes(d.doc_type)&&interests.has(d.revision.document_id))));
}
export function stepDocument(parent,all,step) {return experimentDocuments(parent,all).find(d=>d.doc_type===step.type);}
export function phase(parent,all) {
 const children=experimentDocuments(parent,all);
 if(children.some(d=>d.doc_type==='story'))return 'Story';
 if(children.some(d=>d.doc_type==='action'))return 'Action';
 if(children.some(d=>d.doc_type==='experiment_start'&&d.meta?.started_at))return 'Exploration';
 return 'Taking shape';
}
export function parseSections(markdown,fields) {
 const values=Object.fromEntries(fields.map(([heading])=>[heading,'']));
 const extras=[];let active=null;const prelude=[];let fenced=false;
 for(const line of markdown.split('\n')) {
  const fence=/^\s*(```|~~~)/.test(line);
  const match=!fenced&&!fence?line.match(/^## (.+)$/):null;
  if(fence)fenced=!fenced;
  if(match) {active=match[1];if(!(active in values))extras.push(line);continue;}
  if(active&&active in values)values[active]+=`${line}\n`;
  else if(active)extras.push(line);else prelude.push(line);
 }
 for(const key of Object.keys(values))values[key]=values[key].trim();
 const before=prelude.join('\n').trim();
 if(before&&fields.length)values[fields[0][0]]=[before,values[fields[0][0]]].filter(Boolean).join('\n\n');
 return {values,extra:extras.join('\n').trim()};
}
export function composeSections(fields,values,extra='') {
 return [...fields.filter(([h])=>values[h]?.trim()).map(([h])=>`## ${h}\n\n${values[h].trim()}`),extra.trim()].filter(Boolean).join('\n\n');
}
export function startReadiness(parent,all) {
 const children=experimentDocuments(parent,all),participation=children.find(d=>d.doc_type==='participation'),schedule=children.find(d=>d.doc_type==='meeting_plan');
 if(!['solo','partner'].includes(participation?.meta?.participation?.mode))return 'Choose a partner arrangement or decide to go alone first.';
 if(participation.meta.participation.mode==='partner'&&!participation.meta.participation.agreed)return 'Confirm that you and your partner have agreed to the arrangement.';
 const a=Date.parse(schedule?.meta?.schedule?.week_one??''),b=Date.parse(schedule?.meta?.schedule?.week_two??'');
 if(!Number.isFinite(a)||!Number.isFinite(b)||b<=a)return 'Set both review dates, with the second meeting after the first.';
 return '';
}
export function excerpt(text,length=140) {return (text??'').replace(/^#{1,6}\s.+$/gm,'').replace(/[*_`\[\]]/g,'').trim().slice(0,length);}
