<script lang="ts">
 import {onMount} from 'svelte';
 import {api,message,session} from '$lib/workspace';

 type FeedItem={
  id:string;
  kind:'story'|'invitation_accepted';
  title:string;
  occurred_at:string;
  experiment_id:string|null;
 };

 let items:FeedItem[]=[];
 let loading=true;
 let locating=false;
 let error='';
 let locationError='';

 async function load(location:Record<string,number>={}){
  loading=true;
  error='';
  try{
   items=$session.profile?.preview?[]:(await api.call<FeedItem[]>('member_feed',{},location)??[]);
  }catch(e){
   error=message(e);
  }finally{
   loading=false;
  }
 }

 function findNearby(){
  locationError='';
  if(!navigator.geolocation){
   locationError='This browser does not offer location access.';
   return;
  }
  locating=true;
  navigator.geolocation.getCurrentPosition(async ({coords})=>{
   await load({latitude:coords.latitude,longitude:coords.longitude});
   locating=false;
  },()=>{
   locating=false;
   locationError='Location was unavailable. You can still see activity from your projects.';
  },{timeout:10000});
 }

 onMount(()=>{void load();});
</script>

<svelte:head><title>Feed · Regenerate Skagit</title></svelte:head>

<div class="page-heading">
 <h1>Feed</h1>
 <p>Recent stories from your projects and updates on your invitations.</p>
 <button class="button secondary" disabled={loading||locating||$session.profile?.preview} on:click={findNearby}>
  {locating?'Finding nearby stories…':'Show nearby stories'}
 </button>
 <p class="fine">Use your current location to include public stories within 50 km.</p>
 {#if locationError}<p class="alert" role="alert">{locationError}</p>{/if}
</div>

{#if loading}
 <p role="status">Loading your feed…</p>
{:else if error}
 <p class="alert" role="alert">{error}</p>
 <button class="button secondary" on:click={()=>load()}>Reload feed</button>
{:else if items.length===0}
 <div class="empty-card"><p>No recent activity to show.</p></div>
{:else}
 <section aria-label="Recent activity">
  {#each items as item (item.kind+item.id)}
   <article class="panel feed-item">
    <span class="eyebrow">{item.kind==='story'?'Story':'Invitation accepted'}</span>
    <h2>
     {#if item.experiment_id}
      <a href={'/view/?id='+encodeURIComponent(item.experiment_id)}>{item.title}</a>
     {:else}
      {item.title}
     {/if}
    </h2>
    <time class="fine" datetime={item.occurred_at}>{new Date(item.occurred_at).toLocaleDateString()}</time>
   </article>
  {/each}
 </section>
{/if}

<style>
 .feed-item{margin-bottom:12px}
 .feed-item h2{margin:5px 0}
 .feed-item a:hover{text-decoration:underline}
</style>
