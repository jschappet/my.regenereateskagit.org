<script lang="ts">
 export let stage='idea';
 export let id:string;
 const tabs=[['idea','Idea'],['spark','Spark'],['focus','Focus']];
 let buttons:HTMLButtonElement[]=[];

 function tabKey(event:KeyboardEvent,index:number){
  const next={ArrowLeft:(index+2)%3,ArrowRight:(index+1)%3,Home:0,End:2}[event.key];
  if(next===undefined)return;
  event.preventDefault();
  stage=tabs[next][0];
  buttons[next]?.focus();
 }
</script>

<div class="row wrap tabs" role="tablist" aria-label="Idea stages">
 {#each tabs as [key,label],index}
  <button type="button" class="button" class:primary={stage===key} role="tab"
   id={id+'-tab-'+key} aria-controls={id+'-panel-'+key} aria-selected={stage===key} tabindex={stage===key?0:-1} bind:this={buttons[index]}
   on:click={()=>stage=key} on:keydown={event=>tabKey(event,index)}>{label}</button>
 {/each}
</div>
