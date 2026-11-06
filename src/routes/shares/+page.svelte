<script lang="ts">
 import {onMount} from 'svelte';import {page} from '$app/stores';import {api,message,session} from '$lib/workspace';import {renderMarkdown} from '$lib/markdown.mjs';import ShareLinks from '$lib/ShareLinks.svelte';import SignIn from '$lib/SignIn.svelte';
 type Share={id:string;title:string;description:string;image:string;body:string;author:string;kind:string;url:string;is_owner:boolean;following_requested:boolean};
 let share:Share|null=null,error='',loading=true,busy=false,login=false,loadedUser:number|undefined;
 $: userId=$session.profile?.user?.id;
 $: if(share&&userId!==loadedUser){loadedUser=userId;void load();}
 async function load(){try{const id=$page.url.searchParams.get('id');if(!id)throw new Error('This share link is incomplete.');share=await api.call<Share>('share_view',{id});if(!share)throw new Error('This share is not available.');}catch(e){error=message(e);}finally{loading=false;}}
 async function follow(){if(!$session.profile?.authenticated){login=true;return;}busy=true;error='';try{await api.call('share_follow',{id:share!.id},{});await load();}catch(e){error=message(e);}finally{busy=false;}}
 onMount(()=>{loadedUser=userId;void load();});
</script>
<svelte:head><title>{share?.title||'A shared experiment'} · Regenerate Skagit</title><meta name="robots" content="noindex,nofollow"/><meta name="referrer" content="no-referrer"/>{#if share}<meta name="description" content={share.description}/><meta property="og:title" content={share.title}/><meta property="og:description" content={share.description}/><meta property="og:image" content={share.image}/><meta property="og:url" content={share.url}/><meta property="og:type" content="website"/><meta name="twitter:card" content="summary_large_image"/>{/if}</svelte:head>
<main class="invitation-landing"><a class="eyebrow" href="/">REGENERATE SKAGIT · RAFT</a>{#if $session.profile?.preview}<p class="fine">Sample workspace</p>{/if}
 {#if loading}<p role="status">Opening this share…</p>{:else if share}<div class="page-heading"><span class="eyebrow">A SHARED {share.kind.toUpperCase()}</span><h1>{share.title}</h1><p>Shared by {share.author}</p><p>{share.description}</p></div><img class="invitation-photo" src={share.image} alt="Shared invitation or experiment cover"/><ShareLinks url={share.url} title={share.title} description={share.description}/><section class="panel"><div class="invitation-body">{@html renderMarkdown(share.body)}</div></section>
 {#if !share.is_owner}<section class="panel invitation-response"><h2>Follow the learning.</h2><p class="fine">Request to follow along. This records your interest without opening private notes.</p>{#if share.following_requested}<p class="success" role="status">Your request to follow along is recorded.</p>{:else}<button class="button primary" disabled={busy} on:click={follow}>Request to follow along</button>{/if}</section>{/if}
 {#if login&&!$session.profile?.authenticated}<SignIn/>{/if}{/if}{#if error}<p class="alert" role="alert">{error}</p>{/if}
</main>
