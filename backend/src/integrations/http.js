const {AppError}=require('../lib/errors');
async function jsonRequest(url,{method='GET',body,headers={},timeoutMs=8000}={}){
  try{const r=await fetch(url,{method,body:body===undefined?undefined:JSON.stringify(body),headers:{Accept:'application/json',...(body===undefined?{}:{'Content-Type':'application/json'}),...headers},signal:AbortSignal.timeout(timeoutMs)});
    if(!r.ok)throw Object.assign(new AppError(503,'DEPENDENCY_UNAVAILABLE',`Upstream returned ${r.status}`),{retryable:r.status===429||r.status>=500});
    return await r.json();
  }catch(e){if(e instanceof AppError)throw e;throw new AppError(503,'DEPENDENCY_UNAVAILABLE','Upstream timed out or returned invalid JSON');}
}
module.exports={jsonRequest};
