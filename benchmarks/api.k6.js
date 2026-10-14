import http from 'k6/http';
import {check,sleep} from 'k6';
export const options={vus:5,duration:'30s',thresholds:{http_req_failed:['rate<0.01'],'http_req_duration{phase:estimate}':['p(95)<2000']}};
const base=__ENV.BASE_URL||'http://localhost:3001';
const scenario={name:'Load fixture',capacityKwp:5,inverterKw:5,tiltDeg:15,azimuthDeg:180,lossPct:14,shadingPct:0,monthlyConsumptionKwh:1000,selfConsumptionPct:60,importRate:50,exportRate:20,monthlyOperatingCost:1000,panelCost:1000000,inverterCost:400000,installationCost:400000,currency:'LKR',tariffKind:'flat'};
export function setup(){
  const login=http.post(`${base}/api/auth/register`,JSON.stringify({name:'Load Test',email:`load-${Date.now()}@example.com`,password:'LoadTestPassword123!',accountType:'household'}),{headers:{'Content-Type':'application/json'}});
  if(login.status!==201)throw Error(`Setup register failed ${login.status}`);
  const headers={'Content-Type':'application/json','x-csrf-token':login.json('csrfToken'),Cookie:`sid=${login.cookies.sid[0].value}`};
  const site=http.post(`${base}/api/sites`,JSON.stringify({name:'Load site',type:'household',latitude:6.9271,longitude:79.8612,timezone:'Asia/Colombo',roofAreaM2:60}),{headers});
  if(site.status!==201)throw Error('Setup site failed');
  const proposal=http.post(`${base}/api/sites/${site.json('id')}/scenarios`,JSON.stringify(scenario),{headers});
  if(proposal.status!==201)throw Error('Setup scenario failed');
  return {siteId:site.json('id'),scenarioId:proposal.json('id'),headers};
}
export default function(data){const r=http.post(`${base}/api/scenarios/${data.scenarioId}/estimates`,'{}',{headers:data.headers,tags:{phase:'estimate'}});check(r,{'estimate persisted':r=>r.status===201,'twelve months returned':r=>r.status===201&&r.json('financial.months').length===12});sleep(.2);}
export function teardown(data){http.del(`${base}/api/sites/${data.siteId}`,null,{headers:data.headers});}
