<script lang="ts">
 import {draftTags,normalizeTag} from '$lib/content.mjs';
 import {isMapCopy} from '$lib/raft-flow.mjs';
 import {page} from '$app/stores';import {documents,openCreate} from '$lib/workspace';import {labels,excerpt} from '$lib/journey.mjs';import Icon from '$lib/Icon.svelte';
 import {documentUrl} from '$lib/document-links.mjs';
 let search='',tag='',filter=$page.url.searchParams.get('type')||'';
 $: library=$documents.filter(doc=>!isMapCopy(doc));
 $: tags=[...new Set(library.flatMap(draftTags))].sort();
 $: query=search.trim().toLowerCase();
 $: rows=library.filter(d=>(!filter||d.doc_type===filter)
  &&(!tag||draftTags(d).includes(tag))
  &&(!query||(query.startsWith('#')?draftTags(d).includes(normalizeTag(query)):`${d.title} ${d.body_md} ${draftTags(d).join(' ')}`.toLowerCase().includes(query))));
 $: types=[...new Set(library.map(d=>d.doc_type))];
</script>
<div class="page-heading"><span class="eyebrow">YOUR PERSONAL LIBRARY</span><h1>A place for every thought.</h1><p>Interests, experiments, stories, and the notes in between.</p></div><div class="library-toolbar"><input class="search-input" type="search" bind:value={search} aria-label="Search your documents" placeholder="Search notes or #tags…"/><select bind:value={filter} aria-label="Filter document type"><option value="">All documents</option>{#each types as type}<option value={type}>{labels[type]||type}</option>{/each}</select><select bind:value={tag} aria-label="Browse tags"><option value="">All tags</option>{#each tags as name}<option value={name}>{name}</option>{/each}</select><button class="button primary" on:click={()=>openCreate('idea')}><Icon name="plus" size={16}/>New draft</button></div><div class="document-table"><div class="document-table-heading"><span>DOCUMENT</span><span>TYPE</span><span>VERSION</span><span></span></div>{#each rows as doc}<a href={documentUrl(doc.revision.document_id,$documents)??'/library/'} class="document-table-row"><div><strong>{doc.title}</strong><p>{excerpt(doc.body_md,90)||'Room to keep writing.'}</p>{#if draftTags(doc).length}<small class="fine">{draftTags(doc).map(name=>`#${name}`).join(' · ')}</small>{/if}</div><span class="document-type">{labels[doc.doc_type]||doc.doc_type}</span><span class="fine">v{doc.revision.revision_number}</span><Icon name="arrow" size={17}/></a>{:else}<div class="empty-card"><Icon name="book" size={28}/><h3>{(query||filter||tag)?'No matching notes yet.':'Your library has room to grow.'}</h3><p>{(query||filter||tag)?'Try a different phrase or clear the filters.':'Start with an interest or an idea.'}</p></div>{/each}</div>
