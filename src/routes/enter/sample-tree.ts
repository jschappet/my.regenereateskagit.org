const groups = [
 {
  name: 'Scope',
  tasks: [
   'Confirm the scope (LHC only), primary audience and evaluation questions',
   'Agree on the components and timeline'
  ]
 },
 {
  name: 'Desktop research',
  tasks: [
   'List the source documents: founding docs, curriculum, grant language, classroom transcripts, budgets',
   'Map the intended purpose of each design element (showcase, mapping workshop, flow funding and so on)',
   'Write a short profile of each landscape group: team size, stage, context',
   'Optional: run AI “defining moments” analysis of past LHC meeting notes'
  ]
 },
 {
  name: 'Framing',
  tasks: [
   'Finish the framing document (vision, purpose, audiences, consent)',
   'Committee reviews the framing document'
  ]
 },
 {
  name: 'Interview design',
  tasks: [
   'Draft the revised individual interview questions',
   'Review the question structure from a research design lens',
   'Check the questions against the evaluation questions and Theory U ideas',
   'Decide how people are grouped (random, purposeful, or same landscape) and whether an outside third person joins',
   'Set the call length, roles (storyteller, interviewer, reflector) and call structure',
   'Pilot the questions with 2–3 committee members and adjust'
  ]
 },
 {
  name: 'Consent and data',
  tasks: [
   'Write the consent form: recording, transcripts, AI processing, editing rights, what’s shared publicly',
   'Set up a secure, private folder for transcripts',
   'Write safety guidance for calls: no AI note-takers, everyone visible or identified',
   'Plan how to care for tensions that surface during interviews'
  ]
 },
 {
  name: 'Recruitment',
  tasks: [
   'Finalize the participant list (all LHC stewards, including those who drifted away)',
   'Send invitations with the framing document, consent form and booking instructions',
   'Assign groups and help them find times',
   'Name a liaison to answer stewards’ questions'
  ]
 },
 {
  name: 'Conducting',
  tasks: [
   'Hold the individual interview calls',
   'Send reminders and follow up on unbooked calls',
   'Collect transcripts and confirm consent for each'
  ]
 },
 {
  name: 'Analysis',
  tasks: [
   'Participants review and edit their transcripts',
   'Decide the method: AI first, traditional coding, or both',
   'Remove identifying details where needed',
   'Run a first-pass theme synthesis',
   'Check the themes against the evaluation questions and desktop research',
   'Summarize the individual round’s findings to shape the group round questions'
  ]
 }
];

export type Entry = {
 id: number;
 parentId: number | null;
 interest: string;
 tags: string[];
 location: string;
 notes: string;
};

export function createSampleTree(): Entry[] {
 const entries: Entry[] = [];

 function append(interest: string, parentId: number | null) {
  const id = entries.length + 1;
  entries.push({ id, parentId, interest, tags: [], location: '', notes: '' });
  return id;
 }

 const rootId = append('Scope Items', null);
 for (const { name, tasks } of groups) {
  const groupId = append(name, rootId);
  for (const task of tasks) {
   append(task, groupId);
  }
 }

 return entries;
}
