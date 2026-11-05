import {test} from 'node:test';import assert from 'node:assert/strict';import {createRecovery} from '../src/lib/recovery.mjs';
function storage(){const values={};return new Proxy(values,{get:(target,key)=>key==='getItem'?name=>target[name]??null:key==='setItem'?(name,value)=>target[name]=value:key==='removeItem'?name=>delete target[name]:target[key]});}
test('saving one tab cannot erase another tab’s unsaved notes, and accounts remain isolated',()=>{
 const local=storage(),a=createRecovery(local,storage(),()=> 'a'),b=createRecovery(local,storage(),()=> 'b');
 a.write(7,'idea',{payload:'First thought',saved_at:'2026-11-05T10:00:00Z'});
 b.write(7,'idea',{payload:'Second thought',saved_at:'2026-11-05T11:00:00Z'});
 a.clear(7,'idea');assert.equal(b.read(7,'idea').payload,'Second thought');assert.equal(a.read(8,'idea'),null);
 const reopened=createRecovery(local,storage(),()=> 'c');const recovered=reopened.read(7,'idea');assert.equal(recovered.payload,'Second thought');
 reopened.clear(8,'idea',recovered._storageKey);assert.equal(b.read(7,'idea').payload,'Second thought');
 b.write(8,'idea',{payload:'Another account'});reopened.clearUser(7);assert.equal(b.read(7,'idea'),null);assert.equal(b.read(8,'idea').payload,'Another account');
});
test('unavailable browser storage reports recovery failure instead of claiming success',()=>{
 const store=createRecovery({getItem(){throw Error('blocked')},setItem(){throw Error('full')},removeItem(){}},storage(),()=> 'a');
 assert.equal(store.write(7,'idea',{payload:'Notes'}),false);assert.equal(store.read(7,'idea'),null);
});
