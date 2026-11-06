<script lang="ts">
 import {cleanShareUrl,shareDestinations,invitationText} from './share-links.mjs';
 export let url:string;export let title='An invitation';export let description='';export let kind='invitation';
 let copied='',error='',fallback='',input:HTMLTextAreaElement;
 $: safeUrl=typeof location!=='undefined'?cleanShareUrl(url,location.origin):url;
 $: text=invitationText(safeUrl,title,description,kind);
 $: destinations=shareDestinations(safeUrl,title,description,kind);
 async function copy(withText:boolean){error='';copied='';fallback='';const value=withText?text:safeUrl;try{await navigator.clipboard.writeText(value);copied=withText?'Link and invitation text copied.':'Link copied.';}catch{fallback=value;error='Select and copy the text below.';const {tick}=await import('svelte');await tick();input?.focus();input?.select();}}
</script>
<div class="share-links"><div class="row wrap"><button type="button" class="button primary" on:click={()=>copy(false)}>Copy link only</button><button type="button" class="button secondary" on:click={()=>copy(true)}>Copy link and invitation text</button><a class="button secondary" href={destinations.sms}>Text link</a><a class="button secondary" href={destinations.email}>Email link</a></div><label>Share link<input readonly value={safeUrl} on:focus={e=>e.currentTarget.select()}/></label><details><summary>Preview invitation text</summary><p style="white-space:pre-wrap">{text}</p></details>{#if copied}<p class="success" role="status">{copied}</p>{/if}{#if error}<p class="fine" role="status">{error}</p><label>Text to copy<textarea bind:this={input} readonly value={fallback} rows={fallback===safeUrl?2:10} on:focus={e=>e.currentTarget.select()}></textarea></label>{/if}</div>
