let csrf='';
export function setCsrf(value){csrf=value||'';}
export async function api(path,{method='GET',body}={}){
  const res=await fetch(`/api${path}`,{method,credentials:'include',headers:{...(body===undefined?{}:{'Content-Type':'application/json'}),...(['POST','PATCH','DELETE','PUT'].includes(method)&&csrf?{'x-csrf-token':csrf}:{})},body:body===undefined?undefined:JSON.stringify(body)});
  const data=res.status===204?null:await res.json();
  if(!res.ok){const error=new Error(data?.error?.message||'Request failed');error.status=res.status;error.details=data?.error?.details;throw error;}
  return data;
}
