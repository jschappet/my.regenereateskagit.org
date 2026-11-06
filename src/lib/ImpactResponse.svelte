<script lang="ts">
 import {api,message} from './workspace';
 import {beforeNavigate} from '$app/navigation';
 export let shareId:string;
 let kind='feedback',body='',name='',busy=false,error='',sent=false,responseId='',submitted='';
 beforeNavigate(({cancel})=>{if(!sent&&body.trim()&&!confirm('Leave without sending your response?'))cancel();});
 const prompts={feedback:'What would you like the experiment owner to know? What worked, or what could be better?',story:'Tell us what happened and how this experiment touched your life or community.',outcome:'What changed because of this experiment? You can include when it happened and any results you noticed.'};
 async function submit(){if(busy)return;busy=true;error='';try{const snapshot=JSON.stringify({kind,body,name});if(snapshot!==submitted){responseId=crypto.randomUUID();submitted=snapshot;}const result=await api.call<{received:boolean}>('share_respond',{id:shareId},{id:responseId,kind,body,name});if(!result?.received)throw new Error('Your response was not confirmed. Please try again.');sent=true;}catch(e){error=message(e);}finally{busy=false;}}
 function another(){sent=false;body='';name='';responseId='';error='';}
</script>
<section class="panel invitation-response" id="respond" aria-labelledby="response-heading">
 <span class="eyebrow">YOUR EXPERIENCE MATTERS</span><h2 id="response-heading">How has this experiment affected you?</h2>
 <p>You don’t need to be part of the experiment to respond. Share feedback, tell a story, or report a change you noticed. No account needed.</p>
 {#if sent}<div role="status"><h3>Thank you for sharing your experience.</h3><p>Your response has been sent privately to the experiment owner.</p></div><button type="button" class="button secondary" on:click={another}>Share another experience</button>
 {:else}<form on:submit|preventDefault={submit}><fieldset disabled={busy} style="border:0;padding:0;margin:0"><label>What would you like to share?<select bind:value={kind}><option value="feedback">Give feedback</option><option value="story">Tell a story</option><option value="outcome">Report an outcome</option></select></label><label for="impact-body">{prompts[kind as keyof typeof prompts]}<textarea id="impact-body" bind:value={body} rows="6" required maxlength="10000"></textarea></label><label>Your name (optional)<input bind:value={name} maxlength="120" autocomplete="name" placeholder="Leave blank to respond anonymously"/></label><p class="fine">Only the experiment owner can read your response here. It won’t appear on this public page. Share only what you’re comfortable sending.</p>{#if error}<p class="alert" role="alert">{error}</p>{/if}<button class="button primary" disabled={busy||!body.trim()}>{busy?'Sending…':'Send my response'}</button></fieldset></form>{/if}
</section>
