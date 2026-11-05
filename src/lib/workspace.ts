import {writable,get} from 'svelte/store';
import {api,ApiError} from '@heron/api-client';
import type {Draft,DraftPayload,Profile,Graph} from './types';
import {sameContent} from './content.mjs';
import {createRecovery} from './recovery.mjs';
export {api,ApiError};
export const session=writable<{loading:boolean;profile:Profile|null;error:string}>({loading:true,profile:null,error:''});
export const documents=writable<Draft[]>([]);
export const graph=writable<Graph>({nodes:[],edges:[],references:[],work:[]});
export const loadingDocuments=writable(false);
export const workspaceError=writable('');
export const dirtyEditor=writable(false);
export const createDialog=writable<{open:boolean;type:string;interestId?:string}>({open:false,type:'experiment'});
export const toast=writable('');
let toastTimer:ReturnType<typeof setTimeout>;
export function notify(message:string){toast.set(message);clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.set(''),4500);}
export function message(error:unknown){return error instanceof Error?error.message:'Something went wrong. Please try again.';}
export async function bootstrap(){
 session.update(s=>({...s,loading:true,error:''}));
 try{
  const profile=await api.call<Profile>('profile_json');
  if(!profile)throw new Error('The server did not return a profile.');
  session.set({loading:false,profile,error:''});
  if(profile.authenticated)try{await refreshDocuments();}catch{/* The signed-in shell shows the workspace error. */}
 }catch(error){session.set({loading:false,profile:null,error:message(error)});}
}
export async function refreshDocuments(){
 loadingDocuments.set(true);workspaceError.set('');
 try{
  if(!await api.has('content_document'))throw new Error('This workspace needs the updated Heron document API. Your saved work is unchanged.');
  const [list,connections]=await Promise.all([api.call<{drafts:Draft[]}>('content_list',{mine:true}),api.call<Graph>('content_graph')]);
  documents.set(list?.drafts??[]);if(connections)graph.set(connections);
 }catch(error){workspaceError.set(message(error));throw error;}
 finally{loadingDocuments.set(false);}
}
export function upsert(draft:Draft){documents.update(all=>[draft,...all.filter(d=>d.revision.document_id!==draft.revision.document_id)]);}
export async function loadDocument(id:string){const draft=await api.call<Draft>('content_document',{document_id:id});if(!draft)throw new Error('Document not found.');upsert(draft);return draft;}
export async function saveDocument(payload:DraftPayload,current:Draft|null,id:string){
 let result:Draft|null;
 if(current)result=await api.call<Draft>('content_update',{id:current.id},payload,{headers:{'If-Match':`"${current.revision.revision_id}"`}});
 else try{result=await api.call<Draft>('content_create',{}, {...payload,document_id:id});}
 catch(error){
  if(!(error instanceof ApiError)||error.status!==409)throw error;
  const existing=await api.call<Draft>('content_document',{document_id:id});
  if(!existing||!sameContent(existing,payload))throw error;
  result=existing;
 }
 if(!result)throw new Error('The server did not return the saved document.');upsert(result);return result;
}
export function currentUser(){return get(session).profile?.user;}
export function openCreate(type='experiment',interestId?:string){createDialog.set({open:true,type,interestId});}
let recovery:ReturnType<typeof createRecovery>|undefined;
function recoveryStore(){return recovery??=createRecovery(localStorage,sessionStorage,()=>crypto.randomUUID());}
export function readRecovery(id:string){try{return recoveryStore().read(currentUser()!.id,id);}catch{return null;}}
export function writeRecovery(id:string,data:unknown){try{return recoveryStore().write(currentUser()!.id,id,data);}catch{return false;}}
export function clearRecovery(id:string,source?:string){try{recoveryStore().clear(currentUser()!.id,id,source);}catch{}}
export async function signOut(){
 await api.call('logout');
 const user=currentUser();try{if(user)recoveryStore().clearUser(user.id);localStorage.removeItem('auth_token');}catch{/* Storage can be unavailable; the server session is already closed. */}api.invalidateCapabilities();documents.set([]);graph.set({nodes:[],edges:[],references:[],work:[]});session.set({loading:false,profile:null,error:''});
}
