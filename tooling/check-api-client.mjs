import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url);
const manifest=JSON.parse(await readFile(new URL('heron-client-manifest.json',root),'utf8'));
for(const [path,digest] of Object.entries(manifest)){
 const content=await readFile(new URL(path,root));
 if(createHash('sha256').update(content).digest('hex')!==digest)throw new Error(`Shared API client changed: ${path}. Synchronize from Heron before building.`);
}
console.log('Shared API client integrity verified.');
