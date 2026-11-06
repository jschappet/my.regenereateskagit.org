<script lang="ts">
 import {onMount} from 'svelte';import {page} from '$app/stores';import {api,message,session} from '$lib/workspace';import {renderMarkdown} from '$lib/markdown.mjs';import SignIn from '$lib/SignIn.svelte';import ImpactResponse from '$lib/ImpactResponse.svelte';
 type Section={document_id:string;title:string;body:string;doc_type:string;audience:string};
 let sections:Section[]=[],responseShareId='',owner=false,group=false,loading=true,error='',login=false,loadedUser:number|undefined;
 $: user=$session.profile?.user?.id;
 $: if(!loading&&user!==loadedUser){loadedUser=user;void load();}
 async function load(){loading=true;error='';try{const id=$page.url.searchParams.get('id');if(!id)throw new Error('This experiment link is incomplete.');const result=await api.call<{sections:Section[];is_owner:boolean;group_access:boolean;response_share_id?:string}>('experiment_view',{id});if(!result)throw new Error('This experiment is not available.');sections=result.sections;owner=result.is_owner;group=result.group_access;responseShareId=result.response_share_id||'';}catch(e){sections=[];responseShareId='';error=message(e);}finally{loading=false;}}
 onMount(()=>{loadedUser=user;void load();});
</script>
<svelte:head><title>Experiment viewer · Regenerate Skagit</title><meta name="robots" content="noindex,nofollow"/><meta name="referrer" content="no-referrer"/></svelte:head>
<main class="invitation-landing"><a class="eyebrow" href="https://regenerateskagit.org/">REGENERATE SKAGIT · RAFT</a><div class="page-heading"><span class="eyebrow">EXPERIMENT VIEWER</span><h1>{sections.find(s=>s.doc_type==='experiment')?.title||'A shared experiment'}</h1><p>{owner?'This is your shared view. Private sections are hidden here.':group?'Shared with your invitation role groups.':'Explore the sections the experiment owner has made public.'}</p></div>
 {#if loading}<p role="status">Opening experiment…</p>{:else}{#each sections as section (section.document_id)}<section class="panel"><span class="eyebrow">{section.doc_type.replaceAll('_',' ')} · {section.audience}</span><h2>{section.doc_type==='experiment'?'About this experiment':section.title}</h2><div class="invitation-body">{@html renderMarkdown(section.body)}</div></section>{:else}{#if !error}<p>No sections have been shared yet.</p>{/if}{/each}{/if}
 {#if !owner&&responseShareId}<ImpactResponse shareId={responseShareId}/>{/if}
 {#if error}<p class="alert" role="alert">{error}</p>{/if}{#if !$session.profile?.authenticated}<p class="fine">Already a group member? Sign in to see sections shared with your role groups.</p><button type="button" class="button secondary" on:click={()=>login=true}>Sign in to view group sections</button>{#if login}<SignIn/>{/if}{/if}
</main>
