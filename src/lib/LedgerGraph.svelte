<script>
 import {onDestroy} from 'svelte';import {feedbackLabel,renderConnections} from './ledger-graph.mjs';
 export let nodes=[];export let links=[];
 let svg,cleanup=()=>{};
 $: feedbackDescription=nodes.filter(node=>node.feedbackCount!==undefined)
  .map(node=>node.title+' has '+feedbackLabel(node.feedbackCount)).join('. ');
 function draw(nodes,links){cleanup();cleanup=renderConnections(svg,nodes,links);}
 $: if(svg)draw(nodes,links);
 onDestroy(()=>cleanup());
</script>
<svg bind:this={svg} class="ledger-graph" role="img" aria-label={feedbackDescription?'Experiment connections. '+feedbackDescription+'.':'Experiment connections'}></svg>
