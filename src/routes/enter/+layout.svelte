<script lang="ts">
 import SignIn from '$lib/SignIn.svelte';
 import { bootstrap, session } from '$lib/workspace';
</script>

{#if $session.loading}
 <main class="enter-shell"><p role="status">Loading Enter Workspaces…</p></main>
{:else if $session.error}
 <main class="enter-shell">
  <p role="alert">{$session.error}</p>
  <button type="button" class="button" on:click={bootstrap}>Try again</button>
 </main>
{:else if !$session.profile?.authenticated}
 <SignIn />
{:else}
 <slot />
{/if}

<style>
 :global(.enter-shell) { width: min(100% - 2rem, 46rem); margin: 2rem auto; }
</style>
