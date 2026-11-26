import type { Draft } from '$lib/types';
import { api, loadDocument, saveDocument } from '$lib/workspace';
import type { Entry } from './sample-tree';

export const workspaceType = 'enter_workspace';

export type WorkTiming = {
 startDate: string;
 endDate: string;
 estimatedMinutes: number | null;
};

export type CommitResult = {
 entryId: number;
 status: '' | 'done' | 'postponed';
 notes: string;
 actualMinutes: number | null;
 completedOn: string;
 beforePhoto: string;
 afterPhoto: string;
};

export type WorkCommit = {
 id: string;
 startingEnterId: number;
 timing: WorkTiming;
 results: CommitResult[];
 savedAt: string;
 storyMarkdown?: string;
};

export type WorkspaceTree = {
 version: 1;
 entries: Entry[];
 trashedIds: number[];
 commits?: WorkCommit[];
};

export function workspaceUrl(id: string) {
 return `/enter/?workspace=${encodeURIComponent(id)}`;
}

export async function listWorkspaces() {
 const result = await api.call<{drafts: Draft[]}>('content_list', {mine: true, docType: workspaceType});
 return (result?.drafts ?? []).filter(draft => draft.doc_type === workspaceType)
  .sort((a, b) => b.revision.saved_at.localeCompare(a.revision.saved_at));
}

export async function openWorkspace(id: string) {
 const draft = await loadDocument(id);
 if (draft.doc_type !== workspaceType || !draft.details) throw new Error('Enter Workspace not found.');
 const tree: WorkspaceTree = JSON.parse(draft.details);
 if (tree.version !== 1 || !Array.isArray(tree.entries) || !Array.isArray(tree.trashedIds)) {
  throw new Error('This Enter Workspace could not be opened.');
 }
 return { draft, tree };
}

export function saveWorkspace(title: string, tree: WorkspaceTree, current: Draft | null, id: string) {
 return saveDocument({
  doc_type: workspaceType, title, details: JSON.stringify(tree),
  body_md: current?.body_md ?? '', meta: current?.meta ?? {}
 }, current, id);
}

export function getVisibleEntries(entries: Entry[], trashed: Set<number>) {
 const byId = new Map(entries.map(entry => [entry.id, entry]));
 return entries.filter(entry => {
  const visited = new Set<number>();
  let current: Entry | undefined = entry;
  while (current) {
   if (trashed.has(current.id) || visited.has(current.id)) return false;
   if (current.parentId === null) return true;
   visited.add(current.id);
   current = byId.get(current.parentId);
  }
  return false;
 });
}
