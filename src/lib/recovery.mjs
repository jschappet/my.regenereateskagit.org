/** Recovery copies are account-, document-, and tab-scoped; they are not a sync cache. */
export function createRecovery(storage,sessionStorage,randomId){
 let tab;
 function tabId(){if(tab)return tab;try{tab=sessionStorage.getItem('raft:tab')||randomId();sessionStorage.setItem('raft:tab',tab);}catch{tab=randomId();}return tab;}
 const prefix=(user,id)=>`raft:recovery:${user}:${encodeURIComponent(id)}:`;
 const key=(user,id)=>prefix(user,id)+tabId();
 function read(user,id){try{
  const own=storage.getItem(key(user,id));if(own)return {...JSON.parse(own),_storageKey:key(user,id)};
  return Object.keys(storage).filter(k=>k.startsWith(prefix(user,id))).map(k=>{try{return {...JSON.parse(storage.getItem(k)),_storageKey:k};}catch{return null;}}).filter(Boolean).sort((a,b)=>String(b.saved_at).localeCompare(String(a.saved_at)))[0]||null;
 }catch{return null;}}
 function write(user,id,data){try{storage.setItem(key(user,id),JSON.stringify(data));return true;}catch{return false;}}
 function clear(user,id,source){try{storage.removeItem(source&&source.startsWith(prefix(user,id))?source:key(user,id));}catch{}}
 function clearUser(user){try{for(const k of Object.keys(storage))if(k.startsWith(`raft:recovery:${user}:`))storage.removeItem(k);}catch{}}
 return {read,write,clear,clearUser};
}
