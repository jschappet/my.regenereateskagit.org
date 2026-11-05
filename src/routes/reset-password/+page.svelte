<script lang="ts">
 import {onMount} from 'svelte';import {api,message} from '$lib/workspace';
 let token='',password='',confirmation='',busy=false,error='',done=false,ready=false;
 onMount(()=>{token=new URLSearchParams(location.hash.slice(1)).get('token')||'';if(token)history.replaceState(null,'',location.pathname+location.search);ready=true;});
 async function reset(){error='';if(password!==confirmation){error='The passwords don’t match.';return;}busy=true;try{await api.call('member_password_reset_complete',{}, {token,password});token='';password='';confirmation='';done=true;}catch(e){error=message(e);}finally{busy=false;}}
</script>
<svelte:head><title>Reset password · Regenerate Skagit</title><meta name="robots" content="noindex,nofollow"/><meta name="referrer" content="no-referrer"/></svelte:head>
<main class="recovery-page"><a class="eyebrow" href="/">REGENERATE SKAGIT · RAFT</a><section class="panel"><h1>Choose a new password.</h1>
 {#if done}<p class="success" role="status">Your password has been updated.</p><a class="button primary" href="/">Sign in with your new password</a>
 {:else if ready&&!token}<p class="alert">This reset link is missing its private token. Request a new link to continue.</p><a class="button primary" href="/forgot-password/">Request a new reset link</a>
 {:else}<p>Use at least 12 characters. This link can be used once.</p><form on:submit|preventDefault={reset}><label for="new-password">New password<input id="new-password" type="password" autocomplete="new-password" required minlength="12" maxlength="72" bind:value={password} disabled={busy}/></label><label for="confirm-new-password">Confirm new password<input id="confirm-new-password" type="password" autocomplete="new-password" required bind:value={confirmation} disabled={busy}/></label>
 {#if error}<p class="alert" role="alert">{error}</p><a class="text-link" href="/forgot-password/">Request a new reset link</a>{/if}<button class="button primary" disabled={busy||!ready}>{busy?'Updating password…':'Update password'}</button></form>{/if}</section></main>
