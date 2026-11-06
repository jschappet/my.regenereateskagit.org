import {watch,existsSync} from 'node:fs';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

process.chdir(fileURLToPath(new URL('..',import.meta.url)));
let child,timer,pending=false,stopping=false;
const watchers=[];
const grouped=process.platform!=='win32';

function build(){
 if(child||stopping)return;
 pending=false;
 console.log('\n[build:watch] Building static site…');
 child=spawn(process.execPath,[process.env.npm_execpath,'run','build'],{stdio:'inherit',detached:grouped});
 child.on('error',error=>console.error('[build:watch]',error.message));
 child.on('close',code=>{
  child=undefined;
  if(stopping)return;
  console.log(code===0?'[build:watch] Ready. Watching for changes.':'[build:watch] Build failed. Watching for the next change.');
  if(pending)build();
 });
}
function changed(){
 pending=true;clearTimeout(timer);
 timer=setTimeout(build,250);
}
// Watch inputs, not generated output or dependencies. Full SvelteKit builds also
// rerun prerendering and the static adapter, including client-only CSS changes.
for(const directory of ['src','static','vendor','tooling']){
 if(existsSync(directory))watchers.push(watch(directory,{recursive:true},changed));
}
watchers.push(watch('.',(_event,name)=>{
 if(name&&(/^(package(?:-lock)?\.json|svelte\.config\..+|vite\.config\..+|tsconfig\.json|heron-client-manifest\.json|\.env(?:\..+)?)$/.test(String(name))))changed();
}));
function stop(){
 if(stopping)return;stopping=true;clearTimeout(timer);
 for(const watcher of watchers)watcher.close();
 if(child){try{if(grouped)process.kill(-child.pid,'SIGTERM');else child.kill('SIGTERM');}catch{}}
}
for(const watcher of watchers)watcher.on('error',error=>{
 console.error('[build:watch] File watching failed:',error.message);process.exitCode=1;stop();
});
process.on('SIGINT',stop);process.on('SIGTERM',stop);
build();
