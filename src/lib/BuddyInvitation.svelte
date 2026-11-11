<script lang="ts">
 import {api,message} from './workspace';
 import ShareLinks from './ShareLinks.svelte';
 import type {Draft} from './types';

 export let experiment:Draft;
 const description='Would you like to work on your own small experiment alongside me? We can check in midway and celebrate what we learned at the end.';
 $: title=Array.from(`Be my RAFT accountability buddy: ${experiment.title}`).slice(0,180).join('');
 let url='',error='',busy=false,documentId='';
 type Invitation={active?:boolean;purpose:string;title:string;body:string;url?:string};

 async function prepare(){
  if(busy)return;
  busy=true;
  error='';
  try{
   const params={id:experiment.revision.document_id};
   const list=await api.call<{invitations:Invitation[]}>('invitation_definition_list',params);
   const existing=list?.invitations.find(item=>item.active!==false&&item.purpose==='collaboration'
    &&item.title===title&&item.body===description&&item.url);
   if(existing?.url){url=existing.url;return;}
   documentId ||= crypto.randomUUID();
   const saved=await api.call<{url:string}>('invitation_definition_save',params,{
    document_id:documentId,purpose:'collaboration',title,body:description,description,
   });
   if(!saved?.url)throw new Error('No invitation link was returned. Try again.');
   url=saved.url;
  }catch(reason){error=message(reason);}finally{busy=false;}
 }
</script>

<section class="panel">
 <h3>Invite an accountability buddy</h3>
 <p>Create a link your buddy can open to read the invitation and join your experiment’s buddy group.</p>
 {#if url}
  <ShareLinks {url} {title} {description}/>
 {:else}
  <button type="button" class="button secondary" disabled={busy} on:click={prepare}>
   {busy?'Preparing invitation…':'Get invitation link'}
  </button>
 {/if}
 {#if error}<p class="alert" role="alert">{error}</p>{/if}
</section>
