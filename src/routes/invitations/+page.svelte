<script lang="ts">
 import ImpactResponse from '$lib/ImpactResponse.svelte';
 import {renderMarkdown} from '$lib/markdown.mjs';
 import {onMount} from 'svelte';import {page} from '$app/stores';import {goto} from '$app/navigation';
 import {api,session,message,refreshDocuments,signOut} from '$lib/workspace';import SignIn from '$lib/SignIn.svelte';
 type Invitation={purpose?:string;response_share_id?:string;viewer_url?:string;id:string;title:string;body:string;sender_name:string;is_recipient:boolean;is_sender:boolean;status:string|null;experiment_id:string|null;following_requested:boolean;description:string;image:string;url:string};
 let invitation:Invitation|null=null,loading=true,busy=false,error='',login=false,setupToken='',password='',confirmPassword='',setupDone=false,username='',title='',relationship='from';
 let loadedUser:number|undefined;
 const labels:{[key:string]:string}={feedback:'Share your experience',follow:'Follow this experiment',collaboration:'Accept collaboration invitation',advisor:'Accept advisor invitation'};
 $: purpose=invitation?.purpose||'collaboration';
 $: userId=$session.profile?.user?.id;
 $: if(invitation&&userId!==loadedUser){loadedUser=userId;void load();}
 async function load(){error='';try{const share=$page.url.searchParams.get('share');const id=share||$page.url.searchParams.get('id');if(!id)throw new Error('This invitation link is incomplete.');
  invitation=await api.call<Invitation>(share?'invitation_open':'invitation_view',{id});if(!invitation)throw new Error('Invitation not found.');if(!title)title=invitation.title;
 }catch(e){error=message(e);}finally{loading=false;}}
 onMount(()=>{const fragment=new URLSearchParams(location.hash.slice(1));setupToken=fragment.get('setup')||'';if(setupToken)history.replaceState(null,'',location.pathname+location.search);loadedUser=userId;void load();});
 async function setup(){if(password!==confirmPassword){error='The passwords don’t match.';return;}busy=true;error='';try{
  const result=await api.call<{username:string}>('invitation_setup',{id:invitation!.id},{token:setupToken,password});
  username=result?.username||'';setupToken='';password='';confirmPassword='';setupDone=true;login=true;
 }catch(e){error=message(e);}finally{busy=false;}}
 async function respond(action:string){if(!$session.profile?.authenticated){login=true;return;}if(!invitation?.is_recipient){error='Sign in with the email address this invitation was sent to.';return;}busy=true;error='';try{
  const shared=!!$page.url.searchParams.get('share');
  await api.call(shared?'invitation_join':'invitation_respond',{id:invitation!.id},shared?{}:{action});
  api.invalidateCapabilities();await load();
 }catch(e){error=message(e);}finally{busy=false;}}
 async function switchAccount(){try{await signOut();login=true;await load();}catch(e){error=message(e);}}
 async function follow(){if(!$session.profile?.authenticated){login=true;return;}busy=true;error='';try{await api.call('invitation_follow',{id:invitation!.id},{});await load();}catch(e){error=message(e);}finally{busy=false;}}
</script>
<svelte:head><title>{invitation?.title||'An invitation'} · Regenerate Skagit</title><meta name="robots" content="noindex,nofollow"/><meta name="referrer" content="no-referrer"/></svelte:head>
<main class="invitation-landing"><a class="eyebrow" href="https://regenerateskagit.org/">REGENERATE SKAGIT · RAFT</a>
 {#if $session.profile?.preview}<p class="fine">Sample workspace · no real email is sent.</p>{/if}
 {#if loading}<p role="status">Opening your invitation…</p>{:else if invitation}<div class="page-heading"><span class="eyebrow">{purpose==='feedback'?'YOUR EXPERIENCE MATTERS':'YOU’RE INVITED'}</span><h1>{invitation.title}</h1><p>An invitation from {invitation.sender_name}</p></div><img class="invitation-photo" src={invitation.image} alt="Invitation cover"/><section class="panel"><div class="invitation-body">{@html renderMarkdown(invitation.body)}</div></section>
 {#if invitation.is_sender}<section class="panel"><h2>Your invitation</h2><p>This is what recipients see. Their response joins this invitation’s specific role group. Feedback does not add members.</p></section>
 {:else if purpose==='feedback'}{#if invitation.response_share_id}<ImpactResponse shareId={invitation.response_share_id}/>{:else}<p class="alert">This feedback invitation is not accepting responses. Ask the owner for a current link.</p>{/if}
 {:else}<section class="panel invitation-response"><h2>{labels[purpose]||'Respond to this invitation'}</h2><p>Accepting joins this invitation’s {purpose==='follow'?'follow-along':purpose} group. You can view only the sections shared with that group. Editing and ownership are separate permissions.</p>
 {#if invitation.viewer_url}<p class="success" role="status">You’re a member of this invitation’s group.</p><a class="button primary" href={invitation.viewer_url}>View the experiment</a>
 {:else if invitation.status==='declined'}<p>You declined this invitation.</p>
 {:else if invitation.status==='accepted'}<p>Your previous acceptance no longer grants access. Contact the owner if your membership was removed.</p>
 {:else}<div class="row wrap"><button type="button" class="button primary" disabled={busy||!!setupToken||!!$session.loading||!!$session.profile?.authenticated&&!invitation.is_recipient} on:click={()=>respond('accept')}>{busy?'Saving…':labels[purpose]||'Accept invitation'}</button>{#if !$page.url.searchParams.get('share')}<button type="button" class="button secondary" disabled={busy||!invitation.is_recipient||!$session.profile?.authenticated} on:click={()=>respond('decline')}>Decline invitation</button>{/if}</div>{#if !$session.profile?.authenticated}<p class="fine">Sign in to accept. If you don’t have an account, ask the owner to send an invitation to your email address.</p>{:else if !invitation.is_recipient}<p class="fine">This email invitation is for another account. <button type="button" class="text-button" on:click={switchAccount}>Switch account</button></p>{/if}{/if}</section>{/if}
 {#if setupToken&&purpose!=='feedback'}<form class="panel invitation-response" on:submit|preventDefault={setup}><h2>Make yourself at home</h2><p>Set a password to verify your email, then sign in to respond.</p><label for="setup-password">Choose a password<input id="setup-password" type="password" autocomplete="new-password" bind:value={password} required minlength="12" maxlength="72"/></label><label for="confirm-password">Confirm your password<input id="confirm-password" type="password" autocomplete="new-password" bind:value={confirmPassword} required/></label><button class="button primary" disabled={busy}>Set up my account</button></form>{/if}
 {#if setupDone}<p class="success" role="status">Your account is ready. Sign in with {username} and your new password.</p>{/if}{#if login&&!$session.profile?.authenticated&&purpose!=='feedback'}<SignIn/>{/if}
 {/if}{#if error}<p class="alert" role="alert">{error}</p>{/if}
</main>
