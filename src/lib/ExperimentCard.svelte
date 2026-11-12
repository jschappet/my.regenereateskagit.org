<script lang="ts">
 import type {Draft} from './types';import {documents} from './workspace';import {phase,experimentDocuments,excerpt} from './journey.mjs';import Icon from './Icon.svelte';
 export let experiment:Draft;export let index=0;
 $: children=experimentDocuments(experiment,$documents) as Draft[];
 $: stage=phase(experiment,$documents);
 $: summary=experiment.description||excerpt(children.find(d=>['spark','interest'].includes(d.doc_type))?.body_md||experiment.body_md)||'An interest with room to grow. Open your journey and take the next small step.';
 $: meeting=children.find(d=>d.doc_type==='meeting_plan')?.meta?.schedule?.week_one;
</script>
<a class="experiment-card" href={`/experiments/?id=${experiment.revision.document_id}`}><div class="row between"><span class:stage-green={['Exploration','Action','Brainstorm','Act'].includes(stage)} class="stage"><span></span>{stage}</span><span class="card-index">{String(index+1).padStart(2,'0')}</span></div><h3>{experiment.title}</h3><p>{summary}</p><div class="card-phases" aria-label="Journey phases">{#each (experiment.meta?.workflow_version===2?['Spark','Focus','Brainstorm','Act','Story So Far']:['Interest','Exploration','Action','Story']) as label,i}<span class:recorded={i===0||stage===label}><i></i>{label}</span>{/each}</div><div class="card-footer"><span><Icon name={meeting?'calendar':'book'} size={15}/>{meeting?new Date(meeting).toLocaleDateString(undefined,{month:'short',day:'numeric'})+' · First presentation':children.length?'Your journey is taking shape':'Ready when you are'}</span><span class="round-arrow"><Icon name="arrow" size={17}/></span></div></a>
