const {CircuitBreaker}=require('./breaker');
const {jsonRequest}=require('./http');
class MlClient {
  constructor(url,key=''){this.url=url.replace(/\/$/,'');this.key=key;this.breaker=new CircuitBreaker();}
  request(path,body){return this.breaker.execute(()=>jsonRequest(this.url+path,{method:body?'POST':'GET',body,headers:this.key?{'x-service-key':this.key}:{},timeoutMs:15000}));}
  async health(){await jsonRequest(this.url+'/health',{headers:this.key?{'x-service-key':this.key}:{},timeoutMs:3000});return true;}
  model(){return this.request('/model');}
  plan(body){return this.request('/plan',body);}
  forecast(body){return this.request('/forecast',body);}
}
module.exports={MlClient};
