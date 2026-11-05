<script lang="ts">
 import {api,message} from '$lib/workspace';
 let email='',busy=false,error='',success='';
 async function request(){busy=true;error='';success='';try{const result=await api.call<{message:string}>('member_password_reset_request',{}, {email});success=result?.message||'If an eligible account matches, check your email for a reset link.';}catch(e){error=message(e);}finally{busy=false;}}
</script>
<svelte:head><title>Forgot password · Regenerate Skagit</title><meta name="robots" content="noindex"/></svelte:head>
<main class="recovery-page"><a class="eyebrow" href="/">REGENERATE SKAGIT · RAFT</a><section class="panel"><h1>Forgot your password?</h1><p>Enter your account’s email address. We’ll send a private link to choose a new password.</p>
 <form on:submit|preventDefault={request}><label for="recovery-email">Email address<input id="recovery-email" type="email" autocomplete="email" required maxlength="254" bind:value={email} disabled={busy}/></label>
 {#if error}<p class="alert" role="alert">{error}</p>{/if}{#if success}<p class="success" role="status">{success}</p><p class="fine">Check your spam folder too. Links expire in 30 minutes. Wait a minute before requesting another.</p>{/if}
 <button class="button primary" disabled={busy}>{busy?'Requesting link…':'Email me a reset link'}</button></form><a class="text-link" href="/">Back to sign in</a></section></main>
