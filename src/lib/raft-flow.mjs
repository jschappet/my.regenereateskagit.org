import {steps} from './journey.mjs';

export const raftSteps = [
 ['interest','Interest','I want to make a difference','What do you care about or want to explore in Skagit?'],
 ['brain_dump','Brainstorm','What are all the little pieces?','List small jobs that might take 15–20 minutes. Add ideas freely.'],
 ['experiment_start','Choose','What can I finish this week?','Choose one or more jobs and describe what finishing them will look like.'],
 ['invitation','Invite','Find an accountability buddy','Invite someone to work on their own experiment alongside you, or go solo.'],
 ['exploration','Research','Research and gather','What do you need to learn, gather, or arrange before trying your experiment?'],
 ['meeting_plan','Midpoint','Share what you’ve found','Share your findings and plans with your buddy, or take a moment to check in on your own.'],
 ['action','Action','Do the experiment','Record what you plan to do, what happened, and what you learned.'],
 ['reflection','Celebration','Celebrate what you tried','What did you do and learn? Celebrate with your buddy or on your own.'],
 ['story','Story','Tell the story of your experiment','Write in your own words about what you tried and what you learned.'],
 ['submission','Map','Connect your story to Skagit','Choose one public location and submit your story for review.'],
].map(([key,short,label,intro])=>({...steps.find(step=>step.key===key),key,short,label,intro}));

export const storyPrompts = [
 ['What made you want to be part of this?', 'What caught your attention? What were you hoping to explore, contribute to, change, or be part of? What made you want to give your time to this?'],
 ['Tell us about what happened along the way.', 'What did you do? Who did you meet? What did you see, hear, learn, or notice? Were there particular moments or conversations that stayed with you? What was valuable to you?'],
 ['Has anything changed for you?', 'Have you started thinking differently about something? Have you met people you wouldn’t otherwise have met? Has anything changed in how you relate to your community or the place where you live? Even small changes count.'],
 ['What’s catching your attention now?', 'Did something new spark your interest? What are you curious about now? What would you like to explore more? Is there something you’d like to try, or someone you’d like to work with?'],
 ['What would you like to share with the rest of us?', 'What is something you wish other people in Regenerate Cascadia understood about your experience? What was meaningful, difficult, surprising, or important to you? What would you like us to know?'],
 ['How was it to answer these questions?', 'As you review your results, does anything stand out to you? Is there anything else you wish that we had asked?'],
];

export function brainstormJobs(body){
 return [...new Set((body??'').split(/\r?\n/).map(line=>line.match(/^\s*-(?:\s*\[[ xX]?\]\s*|\s+)(\S.*)$/)?.[1].trim()).filter(Boolean))];
}

export function defaultSprint(){
 const start=new Date();
 const end=new Date(start);
 end.setDate(start.getDate()+7);
 const localDate=date=>new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,10);
 return {start:localDate(start),end:localDate(end)};
}

// A public copy has its own document and review status. Its key is stable across retries.
export const mapKey=id=>'raft-story-'+id;
export const isMapCopy=doc=>doc.doc_type==='experiment'&&doc.meta?.journey_version===1
 && typeof doc.meta.experiment_id==='string'&&doc.meta.experiment_id.startsWith('raft-story-');

export function publicStory(body){
 const sections=body.trim().split(/^## [1-6]\. .+\r?\n/gm);
 if(sections.length!==7)return {exploration:'',happened:body.trim(),takeaway:''};
 const [opening,why,events,...reflections]=sections.map(section=>section.trim());
 return {
  exploration:[opening,why].filter(Boolean).join('\n\n'),
  happened:events,
  takeaway:reflections.filter(Boolean).join('\n\n'),
 };
}
