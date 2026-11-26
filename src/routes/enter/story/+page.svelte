<script lang="ts">
 import { page } from '$app/stores';
 import StoryEditor from './StoryEditor.svelte';
 import { message } from '$lib/workspace';
 import { openWorkspace } from '../workspaces';
 import { storyTemplate } from './story-template';

 $: workspaceId = $page.url.searchParams.get('workspace');
 $: commitId = $page.url.searchParams.get('commit');
 $: commitUrl = workspaceId && commitId
  ? `/enter/commit/?${new URLSearchParams({workspace: workspaceId, commit: commitId})}`
  : '/enter/';
 $: origin = $page.url.origin;
 $: source = loadStory(workspaceId, commitId, origin);

 async function loadStory(workspace: string | null, id: string | null, origin: string) {
  if (!workspace || !id) throw new Error('Open a saved commit to create its story.');
  const { draft, tree } = await openWorkspace(workspace);
  const commit = tree.commits?.find(item => item.id === id);
  if (!commit) throw new Error('This saved commit could not be found.');
  const markdown = commit.storyMarkdown ?? storyTemplate(draft.title, tree, commit, origin);
  return { draft, tree, commit, markdown };
 }
</script>

<svelte:head><title>Write your story · Enter Workspaces</title></svelte:head>

<main class="enter-shell">
 <header>
  <a class="text-link" href={commitUrl}>{workspaceId && commitId ? 'Back to Commit' : 'Enter Workspaces'}</a>
  <h1>Write your story</h1>
 </header>
 {#await source}
  <p role="status">Loading story template…</p>
 {:then result}
  {#key source}
   <StoryEditor draft={result.draft} tree={result.tree} commit={result.commit} initialMarkdown={result.markdown} />
  {/key}
 {:catch error}
  <p class="alert" role="alert">{message(error)}</p>
 {/await}
</main>
