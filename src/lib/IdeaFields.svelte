<script lang="ts">
 export let stage='idea';
 export let spark:{sentence:string;notes:string}[]=[];
 export let focus={sentence:'',notes:''};
 const prompts=[
  'What has captivated your attention lately? What draws you in?',
  'What’s something you keep meaning to try?',
  'If you had a free Saturday morning and a friend to help, what would you explore here in Skagit?',
 ];
</script>

{#if stage==='spark'}
 {#each prompts as prompt,index}
  <fieldset class="group">
   <legend>{prompt}</legend>
   <label>One sentence<input bind:value={spark[index].sentence}/></label>
   <label>Notes<textarea rows="3" bind:value={spark[index].notes}></textarea></label>
  </fieldset>
 {/each}
{:else if stage==='focus'}
 <fieldset class="group">
  <legend>What would you like to explore over the next two weeks?</legend>
  <label>One sentence<input bind:value={focus.sentence}/></label>
  <label>Notes<textarea rows="3" bind:value={focus.notes}></textarea></label>
 </fieldset>
{/if}
