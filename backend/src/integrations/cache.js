'use strict';
class ResourceCache {
  constructor({freshMs=1800000,staleMs=7200000,maxEntries=1000,clock=Date.now}={}){this.freshMs=freshMs;this.staleMs=staleMs;this.maxEntries=maxEntries;this.clock=clock;this.entries=new Map();this.pending=new Map();}
  async get(key,fetcher) {
    const entry=this.entries.get(key);
    if(entry&&this.clock()-entry.time<this.freshMs)return {...entry.value,cache:'fresh'};
    if(this.pending.has(key))return this.pending.get(key);
    const work=(async()=>{try{const value=await fetcher();this.entries.delete(key);this.entries.set(key,{value,time:this.clock()});while(this.entries.size>this.maxEntries)this.entries.delete(this.entries.keys().next().value);return {...value,cache:'miss'};}catch(error){if(entry&&this.clock()-entry.time<this.staleMs)return {...entry.value,cache:'stale',warnings:[...(entry.value.warnings||[]),'Dependency unavailable; cached resource is stale.']};throw error;}})();
    this.pending.set(key,work);
    try{return await work;}finally{this.pending.delete(key);}
  }
}
module.exports={ResourceCache};
