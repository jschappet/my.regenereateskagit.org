<script lang="ts">
 import {api,message,session} from './workspace';
 export let documentId:string;
 export let experimentId:string;
 export let disabled=false;
 type Delivery={id:string;email:string;status:string;delivery:string};
 let email='',sentTo='',loadedDocument='',busy=false,error='',link='',sent:Delivery[]=[],followers:{name:string;email:string}[]=[];
 async function reload(){try{const result=await api.call<{invitations:Delivery[];followers:{name:string;email:string}[]}>('invitation_sent',{id:documentId});sent=result?.invitations||[];followers=result?.followers||[];}catch(e){error=message(e);}}
 $: if(!disabled&&loadedDocument!==documentId){loadedDocument=documentId;void reload();}
 async function send(){if(busy||disabled)return;busy=true;error='';link='';sentTo=email;try{
  const result=await api.call<{url:string}>('invitation_send',{}, {document_id:documentId,experiment_id:experimentId,email});
  if(!result)throw new Error('The server did not confirm delivery.');link=result.url;await reload();
 }catch(e){error=message(e);await reload();}finally{busy=false;}}
</script>
<section class="invitation-send">
 <div class="row between"><h3>Invite someone by email</h3><button type="button" class="text-button" on:click={reload} disabled={busy||disabled}>Refresh status</button></div>{#if $session.profile?.preview}<p class="fine">Sample workspace · no real email is sent.</p>{/if}<p class="fine">We’ll send your saved invitation and a link to respond. Anyone with the link can read the invitation. Your experiment notes stay private.</p>
 <form on:submit|preventDefault={send}><label for="invitation-email">Their email address<input id="invitation-email" type="email" autocomplete="email" bind:value={email} required maxlength="254" disabled={busy}/></label>
 <button class="button primary" disabled={disabled||busy}>{busy?'Sending invitation…':'Send invitation'}</button></form>
 {#if disabled}<p class="fine">Save your notes before sending.</p>{/if}
 {#if error}<p class="alert" role="alert">{error}</p>{/if}
 {#if link}<p class="success" role="status">Invitation sent to {sentTo}.</p><a class="text-link" href={link}>View invitation ↗</a>{/if}
{#if sent.length}<h4>Invitations</h4><ul>{#each sent as invitation}<li><a class="text-link" href={`/invitations/?id=${invitation.id}`}>{invitation.email}</a> <span class="fine">{invitation.delivery==='sent'?invitation.status==='pending'?'Sent · awaiting response':invitation.status:invitation.delivery==='failed'?'Email failed · enter this address to retry':invitation.delivery==='sending'?'Sending…':'Recorded'}</span></li>{/each}</ul>{/if}
 {#if followers.length}<h4>Requests to follow along</h4><ul>{#each followers as person}<li>{person.name} <span class="fine">{person.email}</span></li>{/each}</ul>{/if}
</section>
