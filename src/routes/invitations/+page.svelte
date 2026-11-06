<script lang="ts">
 import ShareLinks from '$lib/ShareLinks.svelte';
 import {renderMarkdown} from '$lib/markdown.mjs';
 import {onMount} from 'svelte';import {page} from '$app/stores';import {goto} from '$app/navigation';
 import {api,session,message,refreshDocuments,signOut} from '$lib/workspace';import SignIn from '$lib/SignIn.svelte';
 type Invitation={id:string;title:string;body:string;sender_name:string;is_recipient:boolean;is_sender:boolean;status:string|null;experiment_id:string|null;following_requested:boolean;description:string;image:string;url:string};
 let invitation:Invitation|null=null,loading=true,busy=false,error='',login=false,setupToken='',password='',confirmPassword='',setupDone=false,username='',title='',relationship='from';
 let loadedUser:number|undefined;
 $: userId=$session.profile?.user?.id;
 $: if(invitation&&userId!==loadedUser){loadedUser=userId;void load();}
 async function load(){error='';try{const id=$page.url.searchParams.get('id');if(!id)throw new Error('This invitation link is incomplete.');
  invitation=await api.call<Invitation>('invitation_view',{id});if(!invitation)throw new Error('Invitation not found.');if(!title)title=invitation.title;
 }catch(e){error=message(e);}finally{loading=false;}}
 onMount(()=>{const fragment=new URLSearchParams(location.hash.slice(1));setupToken=fragment.get('setup')||'';if(setupToken)history.replaceState(null,'',location.pathname+location.search);loadedUser=userId;void load();});
 async function setup(){if(password!==confirmPassword){error='The passwords don’t match.';return;}busy=true;error='';try{
  const result=await api.call<{username:string}>('invitation_setup',{id:invitation!.id},{token:setupToken,password});
  username=result?.username||'';setupToken='';password='';confirmPassword='';setupDone=true;login=true;
 }catch(e){error=message(e);}finally{busy=false;}}
 async function respond(action:string){if(!$session.profile?.authenticated){login=true;return;}if(!invitation?.is_recipient){error='Sign in with the email address this invitation was sent to.';return;}busy=true;error='';try{
  const result=await api.call<{status:string;experiment_id:string|null}>('invitation_respond',{id:invitation!.id},{action,title,relationship});
  await load();if(result?.experiment_id){await refreshDocuments();await goto(`/experiments/?id=${result.experiment_id}`);}
 }catch(e){error=message(e);}finally{busy=false;}}
 async function switchAccount(){try{await signOut();login=true;await load();}catch(e){error=message(e);}}
 async function follow(){if(!$session.profile?.authenticated){login=true;return;}busy=true;error='';try{await api.call('invitation_follow',{id:invitation!.id},{});await load();}catch(e){error=message(e);}finally{busy=false;}}
</script>
<svelte:head><title>An invitation · Regenerate Skagit</title><meta name="robots" content="noindex,nofollow"/><meta name="referrer" content="no-referrer"/></svelte:head>
<div class="invitation-landing">
 <a class="eyebrow" href="/">REGENERATE SKAGIT · RAFT</a>
 {#if $session.profile?.preview}<p class="fine">Sample workspace · no real email is sent.</p>{/if}
 {#if loading}<p>Opening your invitation…</p>{:else if invitation}
 <div class="page-heading"><span class="eyebrow">YOU’RE INVITED</span><h1>{invitation.title}</h1><p>An invitation from {invitation.sender_name}</p></div>
 <img class="invitation-photo" src={invitation.image} alt="Invitation cover"/><ShareLinks url={invitation.url||`/api/invitations/${invitation.id}/share`} title={invitation.title} description={invitation.description}/><section class="panel"><div class="invitation-body">{@html renderMarkdown(invitation.body)}</div></section>
 {#if error}<p class="alert" role="alert">{error}</p>{/if}
 {#if setupToken}
 <form class="panel invitation-response" on:submit|preventDefault={setup}><h2>Make yourself at home</h2><p class="fine">Set a password to verify your email and respond to this invitation.</p>
 <label for="setup-password">Choose a password<input id="setup-password" type="password" autocomplete="new-password" bind:value={password} required minlength="12" maxlength="72"/></label>
 <label for="confirm-password">Confirm your password<input id="confirm-password" type="password" autocomplete="new-password" bind:value={confirmPassword} required/></label><button class="button primary" disabled={busy}>{busy?'Setting up…':'Set up my account'}</button></form>
 {/if}
 <section class="panel invitation-response"><h2>A little company for your curiosity</h2>
 {#if !invitation.is_recipient||invitation.status==='pending'}<p class="fine">Accept to create your own private experiment. Grow from this idea, or explore alongside it. You can plan your dates when you’re ready.</p>
 {#if invitation.is_recipient}<form on:submit|preventDefault={()=>respond('accept')}><label for="experiment-name">Name your experiment<input id="experiment-name" bind:value={title} required maxlength="180"/></label>
 <label for="experiment-relationship">How would you like to explore?<select id="experiment-relationship" bind:value={relationship}><option value="from">Start from this experiment</option><option value="with">Explore alongside this experiment</option></select></label>
 <div class="row wrap"><button class="button primary" disabled={busy}>{busy?'Saving…':'Accept & create my experiment'}</button><button type="button" class="text-button" disabled={busy} on:click={()=>respond('decline')}>Decline invitation</button></div></form>
 {:else}<div class="row wrap"><button class="button primary" disabled={busy||!!setupToken||!!$session.loading||!!$session.profile?.authenticated} on:click={()=>respond('accept')}>Accept invitation</button><button class="button secondary" disabled={busy||!!setupToken||!!$session.loading||!!$session.profile?.authenticated} on:click={()=>respond('decline')}>Decline invitation</button></div>
 {#if invitation.is_sender}<p class="fine">This is your sent invitation. The recipient can accept or decline after signing in.</p>
 {:else if setupToken}<p class="fine">Set up your account above, then sign in to accept or decline.</p>
 {:else if $session.profile?.authenticated}<p class="fine">To respond, <button class="text-button" on:click={switchAccount}>sign in with the email address this invitation was sent to.</button></p>
 {:else}<p class="fine">Sign in to complete your response. New recipients can use the account setup link in their invitation email.</p>{/if}{/if}
 {:else if invitation.status==='accepted'}<p>You accepted this invitation.</p><a class="button primary" href={`/experiments/?id=${invitation.experiment_id}`}>Open my experiment</a>
 {:else}<p>You declined this invitation.</p>{/if}</section>
 {#if !invitation.is_sender&&!invitation.is_recipient}<section class="panel invitation-response"><h2>Curious to see where this goes?</h2><p class="fine">Request to follow along with this experiment. The owner will see your request; their private notes stay private.</p>
 {#if invitation.following_requested}<p class="success" role="status">Your request to follow along has been recorded.</p>{:else}<button class="button primary" disabled={busy} on:click={follow}>Request to follow along</button>{/if}
 {#if $session.profile?.authenticated}<p class="fine">Invited at another email address? <button class="text-button" on:click={switchAccount}>Sign in with that account.</button></p>{/if}
 {#if !$session.profile?.authenticated}<p class="fine">Already invited? <button class="text-button" on:click={()=>login=true}>Sign in to accept or decline.</button> New here? Use the account setup link in your invitation email.</p>{/if}</section>{/if}
 {#if setupDone}<p class="success" role="status">Your account is ready. Sign in with {username} and your new password.</p>{/if}
 {#if login&&!$session.profile?.authenticated}<SignIn/>{/if}
 {:else}<p class="alert" role="alert">{error||'This invitation could not be found.'}</p><button class="button" on:click={load}>Try again</button>{/if}
</div>
