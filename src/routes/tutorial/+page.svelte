<script lang="ts">
 import {openCreate,session} from '$lib/workspace';
</script>

<svelte:head><title>How to Raft · Regenerate Skagit</title></svelte:head>

<div class="raft-guide">
 <div class="page-heading">
  <h1>How to Raft</h1>
  <p>Raft is a simple way to follow your curiosity, try something small, and tell the story of what happened.</p>
 </div>
 <ol class="panel">
  <li>
   <h2>Start with an interest</h2>
   <p>Come in with what's been calling you. Brainstorm freely and don't worry about getting it right. Slowly start writing down possible actions.</p>
   {#if $session.profile?.authenticated}
    <button class="button primary" type="button" on:click={()=>openCreate()}>Start an experiment</button>
   {:else}
    <a class="button primary" href="/">Sign in to start an experiment</a>
   {/if}
   <a class="button secondary" href="/ideas/new/">Start a new Idea</a>
  </li>
  <li>
   <h2>Choose your experiment</h2>
   <p>Your experiment (or embodied action, meaning something you actually do) begins when you've found one action, or a small handful, that can happen this week. Small is good. If you can do it this week, it counts.</p>
   <a class="text-link" href="/experiments/">My experiments</a>
  </li>
  <li>
   <h2>Gather</h2>
   <p>Do a little research. Collect your materials and some background so you feel ready.</p>
  </li>
  <li>
   <h2>Act</h2>
   <p>Go do it, with curiosity and awareness. Be present to the land and to your own body. Notice what you notice.</p>
  </li>
  <li>
   <h2>Tell the story</h2>
   <p>Afterward, we'll guide you through a few prompts that make it easy to write the story of your action. You can link it to topics and to other people's actions. No story is too small.</p>
  </li>
 </ol>
 <nav class="row wrap" aria-label="Explore Raft">
  <a class="button secondary" href="https://regenerateskagit.org/experiments/">Browse experiments to try</a>
  <a class="button secondary" href="/glossary/">Read the glossary</a>
  <a class="button secondary" href="https://regenerateskagit.org/experiments/map/">Explore the interactive map</a>
 </nav>
</div>

<style>
 .raft-guide { max-width: 52rem; margin: 0 auto; padding: 1.5rem; }
 ol.panel { list-style: decimal; padding-inline-start: 3rem; }
 li + li { margin-top: 1.25rem; }
 li h2 { font-size: 1.3rem; }
 li .button { margin-top: .5rem; }
 nav { margin-top: 1.25rem; }
</style>
