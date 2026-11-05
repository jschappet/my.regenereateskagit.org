import {sveltekit} from '@sveltejs/kit/vite';
import {defineConfig,loadEnv} from 'vite';
import {previewApi} from './tooling/preview-api.mjs';
export default defineConfig(({command,mode})=>{
  const env=loadEnv(mode,process.cwd(),'');
  const preview=command==='serve' && env.MEMBER_PREVIEW==='1';
  return {
    plugins:[sveltekit(),...(preview?[previewApi()]:[])],
    server:{port:5173,strictPort:true,proxy:!preview&&env.HERON_ORIGIN?{
      '/api':{target:env.HERON_ORIGIN,changeOrigin:true},
      '/uploads':{target:env.HERON_ORIGIN,changeOrigin:true}
    }:undefined}
  };
});
