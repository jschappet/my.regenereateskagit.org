<script lang="ts">
 import TagEditor from '$lib/TagEditor.svelte';

 const initialTags = ['community', 'soil-health'];
 const availableTags = [
  'community', 'community-gardens', 'compost', 'food-sharing', 'native-plants',
  'seed-saving', 'soil-health', 'tool-sharing', 'water-quality', 'watershed'
 ];
 let tags = [...initialTags];
</script>

<svelte:head>
 <title>Tag widget test · Regenerate Skagit</title>
 <meta name="robots" content="noindex" />
</svelte:head>

<main class="tag-preview">
 <h1>Tag widget test</h1>
 <p>Try adding or removing tags on a sample experiment. Changes are temporary.</p>

 <section class="panel" aria-labelledby="sample-title">
  <div class="row between wrap">
   <h2 id="sample-title">Neighborhood seed swap</h2>
   <button type="button" class="text-button" on:click={() => tags = [...initialTags]}>Reset tags</button>
  </div>
  <TagEditor bind:tags {availableTags} />
 </section>
</main>

<style>
 .tag-preview {
  width: min(100%, 46rem);
  margin: 0 auto;
  padding: clamp(2rem, 8vw, 5rem) clamp(1rem, 4vw, 2rem);
 }
 h1 { font-size: clamp(2.4rem, 7vw, 3.4rem); }
 h2 { margin: 0; }
 .panel { margin-top: 1.75rem; }
</style>
