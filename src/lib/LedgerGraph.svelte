<script>
 import {onDestroy} from 'svelte';import {renderSummary} from './ledger-graph.mjs';
 export let nodes=[];export let links=[];
 let svg,cleanup=()=>{};
 function draw(nodes,links){cleanup();cleanup=renderSummary(svg,nodes,links);}
 $: if(svg)draw(nodes,links);
 onDestroy(()=>cleanup());
</script>
<svg bind:this={svg} class="ledger-graph" role="img" aria-label="Ledger summary graph. Category and connection counts are also listed in the tables below."></svg>
