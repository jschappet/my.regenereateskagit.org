<script lang="ts">
 import {cleanShareUrl,shareDestinations} from './share-links.mjs';
 export let url:string;export let title='An invitation';export let description='';
 let copied=false,error='',input:HTMLInputElement;
 $: safeUrl=typeof location!=='undefined'?cleanShareUrl(url,location.origin):url;
 $: destinations=shareDestinations(safeUrl,title,description);
 async function copy(){error='';copied=false;try{await navigator.clipboard.writeText(safeUrl);copied=true;}catch{input?.focus();input?.select();error='Select and copy the link below.';}}
</script>
<div class="share-links"><div class="row wrap"><button type="button" class="button primary" on:click={copy}>{copied?'Link copied':'Copy share link'}</button><a class="button secondary" href={destinations.sms}>Text link</a><a class="button secondary" href={destinations.email}>Email link</a></div><label>Share link<input bind:this={input} readonly value={safeUrl} on:focus={e=>e.currentTarget.select()}/></label>{#if copied}<p class="success" role="status">Ready to paste into a text or email.</p>{/if}{#if error}<p class="fine" role="status">{error}</p>{/if}</div>
