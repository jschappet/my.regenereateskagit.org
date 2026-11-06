<script lang="ts">
 import InvitationSend from './InvitationSend.svelte';import SharePanel from './SharePanel.svelte';
 import {onMount,onDestroy} from 'svelte';import {beforeNavigate} from '$app/navigation';import Icon from './Icon.svelte';
 import {documents,openCreate,api,ApiError,loadDocument,saveDocument,message,notify,readRecovery,writeRecovery,clearRecovery,upsert,dirtyEditor} from './workspace';
 import type {Draft,DraftPayload,Revision} from './types';import {sameContent} from './content.mjs';
 import {steps,parseSections,composeSections,startReadiness} from './journey.mjs';
 export let documentId:string|undefined=undefined;export let parent:Draft|null=null;export let step:any=null;
 let shareTitle='',shareUploading=false,shareDescription='',shareImage='/api/shares/default-photo.jpg';
 let current:Draft|null=null,id='',recoveryId='',title='',body='',meta:Record<string,any>={},details:string|null=null;
 let values:Record<string,string>={},extra='',loading=true,busy=false,error='',baseline='',pending:any=null,conflict:Draft|null=null;
 let history:Revision[]=[],showHistory=false,historical:Draft|null=null,showMarkdown=false,recoveryFailed=false,ready=false;
 $: fields=step?.fields??[];
 $: nextStep=step?steps[steps.findIndex(s=>s.key===step.key)+1]:null;
 $: outputBody=step&&!showMarkdown?composeSections(fields,values,extra):body;
 $: fingerprint=JSON.stringify({title,body:outputBody,meta,details});
 $: dirty=ready&&fingerprint!==baseline;
 $: dirtyEditor.set(dirty);
 $: if(ready&&dirty&&!pending){fingerprint;recoveryFailed=!writeRecovery(recoveryId,{document_id:id,payload:payload(),revision_id:current?.revision.revision_id??null,saved_at:new Date().toISOString()});}
 function payload():DraftPayload{return {doc_type:step?.type||current?.doc_type||'idea',title:title.trim()||step?.short||'Untitled draft',body_md:outputBody,meta:structuredClone(meta),details,author:current?.author};}
 function adopt(draft:Draft){current=draft;id=draft.revision.document_id;title=draft.title;body=draft.body_md;meta=structuredClone(draft.meta||{});details=draft.details??null;
  const parsed=parseSections(body,fields);values=parsed.values;extra=parsed.extra;historical=null;conflict=null;
  const normalized=step&&!showMarkdown?composeSections(fields,values,extra):body;
  baseline=JSON.stringify({title,body:normalized,meta,details});ready=true;
 }
 async function initialize(){loading=true;error='';try{
  recoveryId=parent&&step?`step:${parent.revision.document_id}:${step.key}`:documentId||id;
  const recovery=readRecovery(recoveryId);
  if(documentId)adopt(await loadDocument(documentId));
  else{id=recovery?.document_id||crypto.randomUUID();title=step?.short||'Untitled draft';meta={workspace_version:1,links:parent?[{relation:'part_of',targets:[{document_id:parent.revision.document_id,title:parent.title}]}]:[]};
   values=Object.fromEntries(fields.map(([heading]:string[])=>[heading,'']));body='';extra='';baseline=JSON.stringify({title,body:'',meta,details});ready=true;
  }
  if(recovery&&(!current||!sameContent(current,recovery.payload)))pending=recovery;else if(recovery)clearRecovery(recoveryId,recovery._storageKey);
 }catch(e){error=message(e);}finally{loading=false;}}
 function recover(){if(!pending)return;const saved=pending;if(writeRecovery(recoveryId,saved))clearRecovery(recoveryId,saved._storageKey);pending=null;title=saved.payload.title;body=saved.payload.body_md;meta=saved.payload.meta;details=saved.payload.details??null;const parsed=parseSections(body,fields);values=parsed.values;extra=parsed.extra;
  if(current&&saved.revision_id!==current.revision.revision_id)conflict=current;
 }
 function discardRecovery(){const source=pending?._storageKey;pending=null;clearRecovery(recoveryId,source);}
 function toggleMarkdown(){if(!showMarkdown){body=outputBody;showMarkdown=true;}else{const parsed=parseSections(body,fields);values=parsed.values;extra=parsed.extra;showMarkdown=false;}}
 async function save(){if(busy||pending||conflict)return;busy=true;error='';try{
  if(JSON.stringify({title,body:outputBody,meta,details})===baseline&&current)return;
  const saved=await saveDocument(payload(),current,id);adopt(saved);clearRecovery(recoveryId);pending=null;notify('Saved to your workspace.');
 }catch(e){if(e instanceof ApiError&&e.status===409){try{conflict=await loadDocument(id);}catch{error=message(e);}}else error=message(e);}finally{busy=false;}}
 async function saveMyVersion(){if(!conflict)return;current=conflict;conflict=null;await save();}
 function useSavedVersion(){if(!conflict)return;adopt(conflict);clearRecovery(recoveryId);}
 async function loadHistory(){error='';try{if(!current)return;history=await api.call<Revision[]>('content_history',{id:current.id})??[];showHistory=!showHistory;}catch(e){error=message(e);}}
 async function inspect(revision:Revision){try{historical=await api.call<Draft>('content_revision',{id:current!.id,revision_id:revision.revision_id});}catch(e){error=message(e);}}
 async function restore(){if(!current||!historical||busy)return;if(dirty&&!confirm('Restore this version? Your unsaved edits will be replaced.'))return;busy=true;error='';try{
  const restored=await api.call<Draft>('content_restore',{id:current.id},{revision_id:historical.revision.revision_id,expected_revision_id:current.revision.revision_id});
  if(restored){upsert(restored);adopt(restored);clearRecovery(recoveryId);notify('Restored as a new saved version.');showHistory=false;}
 }catch(e){error=message(e);}finally{busy=false;}}
 async function begin(){if(!parent)return;const reason=startReadiness(parent,$documents);if(reason){error=reason;return;}meta={...meta,started_at:new Date().toISOString(),start_date:new Date().toLocaleDateString('en-CA')};await save();}
 function localDate(value:string|undefined){if(!value)return '';const date=new Date(value);return new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,16);}
 function setMeeting(key:string,value:string){meta={...meta,schedule:{...meta.schedule,[key]:value?new Date(value).toISOString():null,timezone:Intl.DateTimeFormat().resolvedOptions().timeZone}};}
 function checkLeave(event:BeforeUnloadEvent){if(dirty){event.preventDefault();event.returnValue='';}}
 onMount(()=>{void initialize();window.addEventListener('beforeunload',checkLeave);});
 onDestroy(()=>{dirtyEditor.set(false);if(typeof window!=='undefined')window.removeEventListener('beforeunload',checkLeave);});
 beforeNavigate(({cancel})=>{if(dirty&&!confirm('You have unsaved edits. Leave this page? A recovery copy will stay on this device.'))cancel();});
</script>
{#if loading}<div class="panel loading-panel">Opening your draft…</div>{:else if !ready}<div class="alert" role="alert">{error}<button class="text-button" on:click={initialize}>Try again</button></div>{:else}
 <div class="editor-panel"><div class="editor-meta row between"><span class="private-badge"><Icon name="lock" size={13}/> Only you</span><button class="text-button subtle" on:click={loadHistory} disabled={!current||busy}><Icon name="history" size={15}/>Saved versions{#if current}<span class="version-number">{current.revision.revision_number}</span>{/if}</button></div>
 {#if pending}<div class="recovery-banner"><strong>There are unsaved edits from this device.</strong><p>Bring them back, or keep the version saved in your workspace.</p><div class="row"><button class="button small" on:click={recover}>Recover my edits</button><button class="text-button" on:click={discardRecovery}>Keep saved version</button></div></div>{/if}
 {#if error}<p class="alert" role="alert">{error}</p>{/if}
 {#if conflict}<div class="conflict-panel" role="alert"><strong>Another version was saved while you were writing.</strong><p>Your edits are still here. Compare them with the saved version before deciding.</p><details><summary>Read the saved version</summary><h3>{conflict.title}</h3><pre class="readable-markdown">{conflict.body_md}</pre></details><div class="row wrap"><button class="button small" on:click={saveMyVersion}>Save my version next</button><button class="text-button" on:click={useSavedVersion}>Use saved version</button></div></div>{/if}
 {#if showHistory}<section class="history-panel"><h3>Saved versions</h3><p class="fine">Restoring a version makes a new save. Earlier work stays in your history.</p><div class="history-list">{#each history as revision}<button class:chosen={historical?.revision.revision_id===revision.revision_id} on:click={()=>inspect(revision)}><span>Version {revision.revision_number}</span><small>{new Date(revision.saved_at.replace(' ','T')+'Z').toLocaleString()}</small></button>{/each}</div>{#if historical}<div class="history-preview"><h4>{historical.title}</h4><pre class="readable-markdown">{historical.body_md||'This version is empty.'}</pre><button class="button small" on:click={restore} disabled={busy||!['draft','changes_requested'].includes(current?.status||'')}>Restore this content</button></div>{/if}</section>{/if}
 <fieldset disabled={busy||!!pending||(!['draft','changes_requested'].includes(current?.status||'draft'))} class="editor-fields"><label for="document-title">{step?'A name for these notes':'Title'}<input id="document-title" class="title-input" bind:value={title} placeholder="Give this a name…"/></label>
 {#if step?.key==='invitation'}<div class="form-inset"><label for="connection-breadth">Who would you like to present with?<select id="connection-breadth" value={meta.invitation?.breadth||'any'} on:change={e=>meta={...meta,invitation:{...meta.invitation,breadth:e.currentTarget.value}}}><option value="specific">Someone exploring this specific topic</option><option value="broader">Someone with a broader shared interest</option><option value="any">Anyone going through RAFT</option></select></label><p class="fine">You’ll each work on your own experiment. Coworking means two presentations and Q&A.</p></div>{/if}
 {#if step?.key==='participation'}<div class="choice-row"><label class:chosen={meta.participation?.mode==='partner'}><input type="radio" name="company" checked={meta.participation?.mode==='partner'} on:change={()=>meta={...meta,participation:{...meta.participation,mode:'partner'}}}/> With a presentation partner</label><label class:chosen={meta.participation?.mode==='solo'}><input type="radio" name="company" checked={meta.participation?.mode==='solo'} on:change={()=>meta={...meta,participation:{mode:'solo'}}}/> On my own</label></div>{#if meta.participation?.mode==='partner'}<label for="partner-name">Partner’s name<input id="partner-name" value={meta.participation?.name||''} on:input={e=>meta={...meta,participation:{...meta.participation,name:e.currentTarget.value}}}/></label><label class="checkbox-label"><input type="checkbox" checked={!!meta.participation?.agreed} on:change={e=>meta={...meta,participation:{...meta.participation,agreed:e.currentTarget.checked}}}/>We have agreed to be presentation partners.</label>{/if}{/if}
 {#if step?.key==='meeting_plan'}<div class="date-grid"><label for="week-one">After week one<input id="week-one" type="datetime-local" value={localDate(meta.schedule?.week_one)} on:input={e=>setMeeting('week_one',e.currentTarget.value)}/><small>Research, preparation, and intentions</small></label><label for="week-two">After week two<input id="week-two" type="datetime-local" value={localDate(meta.schedule?.week_two)} on:input={e=>setMeeting('week_two',e.currentTarget.value)}/><small>Findings, reflection, and celebration</small></label></div><p class="fine">Times are in {Intl.DateTimeFormat().resolvedOptions().timeZone}. Working solo? Set your two personal review dates.</p>{/if}
 {#if step?.key==='experiment_start'}<div class="start-inset">{#if meta.started_at}<Icon name="check"/><div><strong>Your experiment has begun.</strong><p>Started {new Date(meta.started_at).toLocaleDateString()}.</p></div>{:else}<Icon name="calendar"/><div><strong>Choosing an experiment didn’t start the clock.</strong><p>Confirm your company and meeting dates, then begin when you’re ready.</p></div>{/if}</div>{/if}
 {#if step&&!showMarkdown}{#each fields as field,i}<label for={`response-${i}`}><span class="prompt-label">{field[1]}</span>{#if field[2]}<span class="field-help">{field[2]}</span>{/if}<textarea id={`response-${i}`} rows={fields.length===1?12:i===0?8:4} bind:value={values[field[0]]} placeholder="Make a little room for your thoughts…"></textarea></label>{/each}{:else}<label for="document-body"><span class="prompt-label">{step?'Your notes in Markdown':'Your notes'}</span><span class="field-help">Markdown is welcome. Plain words are enough.</span><textarea id="document-body" class="markdown-editor" rows="18" bind:value={body} placeholder="What’s on your mind?"></textarea></label>{/if}
 </fieldset>
 {#if current&&!dirty&&!pending&&!conflict}
 <section class="recovery-banner" aria-label="What’s next" aria-live="polite">
 <strong>Your notes are saved.</strong>
 {#if parent&&nextStep}
 <p>You can keep writing here or move on to {nextStep.short.toLowerCase()}.</p>
 <a class="button primary" href={`/experiments/?id=${parent.revision.document_id}&step=${nextStep.key}`}>Continue to {nextStep.short}<Icon name="arrow" size={16}/></a>
 {:else if !parent&&['idea','interest'].includes(current.doc_type)}
 <p>Turn this into a small experiment. Next, give your thoughts room and choose one piece to explore. Your original notes will stay here.</p>
 <button class="button primary" on:click={()=>openCreate('experiment',current!.revision.document_id)}>Build an experiment from this<Icon name="arrow" size={16}/></button>
 {:else}<p>Come back whenever you’re ready, or explore your other saved work.</p><a class="text-link" href="/library/">Back to my library<Icon name="arrow" size={16}/></a>{/if}
 </section>{/if}
 {#if step?.key==='invitation'&&parent}{#if current}<SharePanel document={current} initialTitle={parent.title} bind:title={shareTitle} bind:description={shareDescription} bind:image={shareImage} bind:uploading={shareUploading} disabled={dirty||busy||!!pending||!!conflict}/>{/if}<InvitationSend title={shareTitle} description={shareDescription} image={shareImage} documentId={id} experimentId={parent.revision.document_id} disabled={!current||dirty||busy||shareUploading||!!pending||!!conflict}/>{/if}
 {#if step?.key==='invitation'&&outputBody}<div class="row wrap invitation-actions"><button class="button small" on:click={async()=>{try{await navigator.clipboard.writeText(outputBody);notify('Invitation copied.');}catch{error='Copy isn’t available in this browser. You can select and copy the text above.';}}}><Icon name="mail" size={16}/>Copy invitation</button><a class="text-link" href={`mailto:?subject=${encodeURIComponent('Join me for a RAFT experiment')}&body=${encodeURIComponent(outputBody)}`}>Compose an email ↗</a></div>{/if}
 <div class="editor-bottom"><div><span class="save-status"><span class:unsaved={dirty}></span>{busy?'Saving…':dirty?'Unsaved edits':current?'Saved to your workspace':'A new private draft'}</span>{#if recoveryFailed}<small class="warning">Local recovery isn’t available. Save before leaving.</small>{:else if dirty}<small>Recovery copy kept on this device</small>{/if}</div><div class="row">{#if step}<button class="text-button subtle" on:click={toggleMarkdown} disabled={busy||!!pending}>{showMarkdown?'Guided prompts':'Markdown'}</button>{/if}{#if step?.key==='experiment_start'&&!meta.started_at}<button class="button primary" on:click={begin} disabled={busy||!!pending||!!conflict}>Start my experiment<Icon name="arrow" size={16}/></button>{:else}<button class="button primary" on:click={save} disabled={busy||!!pending||!!conflict||(!dirty&&!!current)}>{busy?'Saving…':'Save my notes'}<Icon name="check" size={16}/></button>{/if}</div></div></div>
{/if}
