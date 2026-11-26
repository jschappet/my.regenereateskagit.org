import type { WorkCommit, WorkspaceTree } from '../workspaces';
import { displayPhotoUrl } from '../photo-url';

function heading(value: string) {
 return value.trim().replace(/\s+/g, ' ').replace(/[\\`*_{}\[\]()#+!<>]/g, '\\$&');
}

function photoImage(label: string, location: string, origin: string) {
 const url = displayPhotoUrl(location, origin);
 return url ? `![${label}](<${url.replace(/</g, '%3C').replace(/>/g, '%3E')}>)` : null;
}

export function storyTemplate(title: string, tree: WorkspaceTree, commit: WorkCommit, origin: string) {
 const names = new Map(tree.entries.map(entry => [entry.id, entry.interest]));
 const sections = [`# ${heading(title) || 'Work set story'}`, '[What were you hoping to accomplish?]'];

 for (const [status, label, prompt] of [
  ['done', 'Done', '[What happened, and what did you learn?]'],
  ['postponed', 'Postponed', '[Why did this wait, and what will you do next?]']
 ] as const) {
  const results = commit.results.filter(result => result.status === status);
  if (!results.length) continue;
  sections.push(`## ${label}`);
  for (const result of results) {
   sections.push(`### ${heading(names.get(result.entryId) ?? '') || 'Untitled Enter'}`);
   const details = [
    result.completedOn ? `- Date completed: ${result.completedOn}` : null,
    result.actualMinutes != null ? `- Actual time: ${result.actualMinutes} minutes` : null
   ].filter(Boolean);
   const photos = [
    photoImage('Before photo', result.beforePhoto, origin),
    photoImage('After photo', result.afterPhoto, origin)
   ].filter(Boolean);
   if (details.length) sections.push(details.join('\n'));
   if (result.notes.trim()) sections.push(result.notes.trim());
   sections.push(...photos.filter((photo): photo is string => photo !== null));
   sections.push(prompt);
  }
 }
 return sections.join('\n\n') + '\n';
}
