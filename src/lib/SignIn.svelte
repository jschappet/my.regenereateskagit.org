<script lang="ts">
 import {api,bootstrap,message} from './workspace';import Icon from './Icon.svelte';
 let username='',password='',busy=false,error='';
 let usernameField:HTMLInputElement;
 const registrationUrl='https://regenerateskagit.org/login/?mode=register';
 function focusLogin(){
  usernameField.focus({preventScroll:true});
  usernameField.scrollIntoView({block:'center'});
 }
 async function login(){busy=true;error='';try{await api.call('login',{},new URLSearchParams({username,password}));password='';await bootstrap();}catch(e){error=e instanceof Error&&'status'in e&&e.status===403?'That username or password wasn’t recognized.':message(e);}finally{busy=false;}}
</script>
<div class="signin-wrap"><div class="signin-story">
    <span class="eyebrow">REGENERATE SKAGIT · RAFT</span>
    <h1>Join our community of action.</h1>
    <div class="row wrap signin-actions">
      <a class="button primary" href={registrationUrl}>Join</a>
      <button type="button" class="button secondary" on:click={focusLogin}>Login</button>
    </div>
    <p>Bring a story of Skagit to the map.<br/>
    Every action adds to the story.<br/>
Help us map what's happening in Skagit by exploring, learning, and acting in this watershed.<br/>
</p><nav class="row wrap signin-guide-links" aria-label="Raft guides">
 <a class="text-link" href="/tutorial/">Tutorial</a>
 <a class="text-link" href="/glossary/">Glossary</a>
</nav><span class="fine">Small experiments. Shared learning. Rooted here.</span></div>
 <form class="signin-card" on:submit|preventDefault={login}>
    <div class="row wrap signin-form-actions">
      <a class="button primary" href={registrationUrl}>Join</a>
      <button type="button" class="button secondary" on:click={focusLogin}>Login</button>
    </div>
    <span class="mini-mark"><Icon name="leaf" size={24}/></span><h2>Welcome to your workspace</h2><p>Sign in to pick up where your curiosity left off.</p><label for="username">Username<input id="username" bind:this={usernameField} autocomplete="username" bind:value={username} required/></label><label for="password">Password<input id="password" type="password" autocomplete="current-password" bind:value={password} required/></label><a class="text-link forgot-password-link" href="/forgot-password/">Forgot password?</a>{#if error}<p class="alert" role="alert">{error}</p>{/if}<button class="button primary" disabled={busy}>{busy?'Signing in…':'Sign in'}<Icon name="arrow" size={17}/></button><p class="fine privacy-line"><Icon name="lock" size={14}/> Your drafts are private. Your work stays yours.</p><a class="text-link" href="https://regenerateskagit.org/">Visit Regenerate Skagit <span>↗</span></a></form>
</div>

<style>
 .signin-story {
  background-image: linear-gradient(100deg, rgb(232 236 223 / 91%), rgb(232 236 223 / 78%)),
   url('/images/map-skagit-river.png');
  background-position: center;
  background-size: cover;
  color: #253826;
 }
 .signin-story > p, .signin-story > .fine, .signin-story > .eyebrow {
  color: #344b34;
 }
 .signin-story > .fine { margin-top: 24px; }
 .signin-guide-links { margin-top: .75rem; }
 .signin-actions { margin: 0 0 16px; }
 .signin-form-actions { display: none; }
 :global(.invitation-landing) .signin-form-actions { display: flex; margin-bottom: 12px; }
 @media (max-width: 700px) {
  .signin-wrap { min-height: 0; }
  .signin-story { padding: 20px 24px; }
  .signin-story h1 { font-size: clamp(28px, 7vw, 40px); margin: 8px 0 12px; }
  .signin-actions { margin: 0 0 8px; }
  .signin-card { padding: 20px 24px; margin: 0 auto; }
  .signin-card h2 { font-size: 25px; }
 }
</style>
