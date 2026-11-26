<script lang="ts">
 import {onMount} from 'svelte';import {page} from '$app/stores';import {beforeNavigate} from '$app/navigation';
 import '../app.css';import Icon from '$lib/Icon.svelte';import SignIn from '$lib/SignIn.svelte';import CreateDialog from '$lib/CreateDialog.svelte';
 import {documents,session,bootstrap,signOut,message,openCreate,toast,workspaceError,dirtyEditor} from '$lib/workspace';
 import {sourceDocument} from '$lib/experiment-source.mjs';
 let mobile=false,sidebarCollapsed=false,logoutError='';
 let mounted = false, bootstrapped = false;
 const navigation=[{path:'/',label:'My workspace',icon:'home'},{path:'/feed/',label:'Feed',icon:'clock'},{path:'/todos/',label:'Todo list',icon:'check'},{path:'/enter/',label:'Enter Workspaces',icon:'library'},{path:'/library/',label:'My library',icon:'library'},{path:'/connections/',label:'Connections',icon:'graph'},{path:'/exports/',label:'Take your work',icon:'download'}];
 $: tagPreview = $page.url.pathname === '/tag-widget/';
 $: standalonePage = tagPreview || $page.url.pathname.startsWith('/enter/');
 onMount(() => { mounted = true; });
 $: if (mounted && !tagPreview && !bootstrapped) {
  bootstrapped = true;
  void bootstrap();
 }
 beforeNavigate(()=>{mobile=false;});
 async function logout(){if($dirtyEditor&&!confirm('Sign out without saving? The local recovery copy will be removed.'))return;logoutError='';try{await signOut();mobile=false;}catch(e){logoutError=message(e);}}
 $: guidePage=['/tutorial/','/glossary/','/ideas/new/'].includes($page.url.pathname);
 $: section=navigation.find(n=>n.path==='/'?$page.url.pathname==='/':$page.url.pathname.startsWith(n.path))?.label||(guidePage?($page.url.pathname==='/tutorial/'?'Tutorial':$page.url.pathname==='/glossary/'?'Glossary':'Start a new Idea'):$page.url.pathname.startsWith('/ledger')?'Ledger':'Experiment workspace');
 $: experiment=$page.url.pathname.replace(/\/$/,'')==='/experiments'
  ? $documents.find(doc=>doc.doc_type==='experiment'&&doc.revision.document_id===$page.url.searchParams.get('id'))
  : undefined;
 $: inspiration=sourceDocument($page.url,$documents);
 $: readOnly=$page.url.searchParams.get('read')==='1';
 $: sharing=$page.url.searchParams.get('share')==='1';
 function shareLink(url:URL,sharing:boolean){
  const params=new URLSearchParams(url.searchParams);
  params.delete('read');
  if(sharing)params.delete('share');else params.set('share','1');
  return `?${params}`;
 }
 function overviewLink(url:URL,readOnly:boolean){
  const params=new URLSearchParams(url.searchParams);
  params.delete('share');
  if(readOnly)params.delete('read');else params.set('read','1');
  return `?${params}`;
 }
 $: initials=($session.profile?.user?.display_name||'You').split(' ').map(n=>n[0]).slice(0,2).join('');
</script>
<svelte:head><title>My workspace · Regenerate Skagit</title><meta name="description" content="A private place to follow your interests, try small experiments, and keep what you learn."/></svelte:head>
{#if standalonePage}<slot/>{:else if ['/invitations','/shares','/view','/forgot-password','/reset-password'].some(path=>$page.url.pathname.startsWith(path))}<slot/>{:else if guidePage&&!$session.profile?.authenticated}
 <main>
  <nav class="row wrap guide-nav" aria-label="Raft guides">
   <a class="text-link" href="/">Workspace</a>
   <a class="text-link" href="/tutorial/">Tutorial</a>
   <a class="text-link" href="/glossary/">Glossary</a>
  </nav>
  <slot/>
 </main>
{:else if $session.loading}<div class="initial-loading"><span class="brand-mark">✳</span><p>Opening your workspace…</p></div>
{:else if $session.error}<main class="connection-state"><span class="brand-mark">✳</span><h1>Let’s get you connected.</h1><p>We couldn’t open your workspace.</p><p class="fine">{$session.error}</p><button class="button primary" on:click={bootstrap}>Try again<Icon name="arrow" size={17}/></button></main>
{:else if !$session.profile?.authenticated}<SignIn/>
{:else}
 <div class="app-frame" class:sidebar-collapsed={sidebarCollapsed}><aside id="workspace-sidebar" class:mobile-open={mobile} class="sidebar"><a class="brand" href="/"><span class="brand-mark">✳</span><div>regenerate<span>SKAGIT · YOUR WORKSPACE</span></div></a><div class="sidebar-section">A LITTLE SPACE TO EXPLORE</div><nav aria-label="Main navigation">{#each navigation as item}<a href={item.path} class:active={item.path==='/'?$page.url.pathname==='/':$page.url.pathname.startsWith(item.path)} aria-current={(item.path==='/'?$page.url.pathname==='/':$page.url.pathname.startsWith(item.path))?'page':undefined}><Icon name={item.icon} size={19}/>{item.label}</a>{/each}</nav><details class="more-menu" open={guidePage||$page.url.pathname.startsWith('/ledger')||$page.url.pathname.startsWith('/admin/drafts')}><summary>More</summary><nav aria-label="More tools"><a href="/tutorial/" class:active={$page.url.pathname==='/tutorial/'}>Tutorial</a><a href="/glossary/" class:active={$page.url.pathname==='/glossary/'}>Glossary</a><a href="/ledger/" class:active={$page.url.pathname.startsWith('/ledger')}><Icon name="graph" size={17}/>Ledger</a>{#if $session.profile.roles.includes('admin')}<a href="/admin/drafts/" class:active={$page.url.pathname.startsWith('/admin/drafts')}>Draft administration</a>{/if}</nav></details><div class="sidebar-note"><span class="small-leaf"><Icon name="leaf" size={23}/></span><p>Big interests.<br/><em>Small, real steps.</em></p><a href="https://regenerateskagit.org/">Out in the community ↗</a></div><div class="account"><span class="avatar">{initials}</span><div><strong>{$session.profile.user?.display_name||'Your account'}</strong><span>Personal workspace</span></div><button class="icon-button" aria-label="Sign out" on:click={logout}><Icon name="logout" size={17}/></button></div>{#if logoutError}<p class="alert">{logoutError}</p>{/if}</aside>
 <div class="app-main"><header class="topbar" class:experiment-topbar={!!experiment}><div class="row topbar-context"><button class="icon-button mobile-toggle" aria-label={mobile?"Hide navigation":"Show navigation"} aria-controls="workspace-sidebar" aria-expanded={mobile} on:click={()=>mobile=!mobile}><Icon name="menu"/></button><button class="icon-button desktop-toggle" aria-label={sidebarCollapsed?"Show navigation":"Hide navigation"} title={sidebarCollapsed?"Show navigation":"Hide navigation"} aria-controls="workspace-sidebar" aria-expanded={!sidebarCollapsed} on:click={()=>sidebarCollapsed=!sidebarCollapsed}><Icon name="menu"/></button>{#if experiment}<h1 class="topbar-experiment-title" title={experiment.title}>{experiment.title}</h1>{:else}<span class="topbar-title">{section}</span>{/if}</div><div class="row topbar-actions">{#if $session.profile.preview}<span class="preview-badge">Sample workspace</span>{/if}<span class="private-badge"><Icon name="lock" size={13}/> Private by default</span>{#if experiment}<a class="button secondary compact" href={overviewLink($page.url,readOnly)}>{readOnly?(experiment.meta?.workflow_version===2?'Back to editor':'Back to notes'):'Read-only view'}</a>{/if}{#if experiment?.meta?.workflow_version===2}<a class="button secondary compact" href={shareLink($page.url,sharing)}>{sharing?'Back to notes':'Invite or share'}</a>{/if}<button class="button primary compact" on:click={()=>openCreate('experiment',inspiration?.revision.document_id)}><Icon name="plus" size={16}/>New experiment</button></div></header>
 <main class="main-content" class:experiment-content={!!experiment}>{#if $workspaceError}<div class="alert" role="alert">{$workspaceError}</div>{/if}<slot/></main><footer class="app-footer"><span>Rooted in curiosity. Connected through learning.</span><span>RAFT · Regenerate Skagit</span></footer></div></div>{#if $toast}<div class="toast" role="status"><Icon name="check" size={17}/>{$toast}</div>{/if}
{/if}
{#if !standalonePage && $session.profile?.authenticated}<CreateDialog/>{/if}

<style>
 .guide-nav { max-width: 52rem; margin: 0 auto; padding: 1.5rem 1.5rem 0; }
</style>
