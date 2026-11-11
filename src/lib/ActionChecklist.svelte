<script lang="ts">
 export let body:string;
 export let checklist=true;
 let newTask='';

 // Keep line endings and all non-task Markdown intact.
 $: lines=body.split(/(\r\n|\n|\r)/);
 $: tasks=readTasks(lines);

 function readTasks(lines:string[]){
  let fence='';
  return lines.flatMap((line,index)=>{
   const marker=line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
   if(marker){
    if(!fence)fence=marker[1];
    else if(marker[1].startsWith(fence)&&!marker[2].trim())fence='';
    return [];
   }
   if(fence)return [];
   const match=line.match(/^(\s*-\s*\[)([ xX]?)(\]\s*)(\S.*)$/);
   return match?[{index,done:/x/i.test(match[2]),label:match[4],prefix:match[1],suffix:match[3]}]:[];
  });
 }

 function toggle(task:typeof tasks[number],done:boolean){
  lines[task.index]=task.prefix+(done?'x':' ')+task.suffix+task.label;
  body=lines.join('');
 }

 function addTask(){
  const title=newTask.trim();
  if(!title)return;
  const newline=body.match(/\r\n|\n|\r/)?.[0]||'\n';
  body+=(body&&!/[\r\n]$/.test(body)?newline:'')+(checklist?'- [ ] ':'- ')+title+newline;
  newTask='';
 }
</script>

{#if checklist}
{#each tasks as task (task.index)}
 <label class="checkbox-label">
  <input type="checkbox" checked={task.done} on:change={event=>toggle(task,event.currentTarget.checked)}/>
  {task.label}
 </label>
{/each}
{/if}
<div class="row wrap">
 <label for="new-action-task">{checklist?'New task':'New brainstorm job'}
  <input id="new-action-task" bind:value={newTask}
   on:keydown={event=>{if(event.key==='Enter'){event.preventDefault();addTask();}}}/>
 </label>
 <button type="button" class="button small" disabled={!newTask.trim()} on:click={addTask}>{checklist?'Add task':'Add job'}</button>
</div>
