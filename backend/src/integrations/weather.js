const {CircuitBreaker}=require('./breaker');
const {ResourceCache}=require('./cache');
const {jsonRequest}=require('./http');
const {AppError}=require('../lib/errors');
const {openWeatherForecast}=require('./openweather');
const MONTHS=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
function validNumber(x,min,max){return Number.isFinite(x)&&x>=min&&x<=max;}
function parseOpenMeteo(data,start,end){
  const h=data.hourly,u=data.hourly_units;
  const fields={shortwave_radiation:'ghiWm2',direct_normal_irradiance:'dniWm2',diffuse_radiation:'dhiWm2',temperature_2m:'tempC',wind_speed_10m:'windMs'};
  if(!h||!u||!Array.isArray(h.time)||!h.time.length)throw new AppError(503,'INVALID_RESOURCE','Missing forecast intervals');
  for(const [key]of Object.entries(fields))if(!Array.isArray(h[key])||h[key].length!==h.time.length)throw new AppError(503,'INVALID_RESOURCE','Unequal forecast arrays');
  if(u.shortwave_radiation!=='W/m²'||u.direct_normal_irradiance!=='W/m²'||u.diffuse_radiation!=='W/m²'||u.wind_speed_10m!=='m/s'||u.temperature_2m!=='°C')throw new AppError(503,'INVALID_RESOURCE','Unexpected forecast units');
  const intervals=h.time.map((t,i)=>{const p={end:new Date(`${t}Z`).toISOString(),durationHours:1};for(const [key,name]of Object.entries(fields))p[name]=h[key][i];if(!validNumber(p.ghiWm2,0,2000)||!validNumber(p.dniWm2,0,2000)||!validNumber(p.dhiWm2,0,2000)||!validNumber(p.tempC,-90,70)||!validNumber(p.windMs,0,150))throw new AppError(503,'INVALID_RESOURCE','Invalid weather values');return p;}).filter(p=>p.end>start&&p.end<=end);
  const expected=(Date.parse(end)-Date.parse(start))/3600000;
  if(intervals.length!==expected||intervals.some((p,i)=>Date.parse(p.end)!==Date.parse(start)+(i+1)*3600000))throw new AppError(503,'INVALID_RESOURCE','Incomplete forecast window');
  return intervals;
}
function demoClimate(){return {dailyGhiKwhM2:[5.1,5.5,5.7,5.4,4.8,4.6,4.8,4.9,4.7,4.6,4.7,4.9],monthlyTempC:[27,28,29,29,28,28,28,28,28,27,27,27],source:'synthetic-demo',period:'synthetic seasonal example',fetchedAt:new Date().toISOString(),warnings:['Synthetic demo resource; unsuitable for real installation decisions.']};}
class WeatherService {
  constructor({dataMode='demo',cache=true,openMeteoKey='',openWeatherKey='',openMeteoUrl='https://api.open-meteo.com/v1/forecast'}={}){this.mode=dataMode;this.cache=cache?new ResourceCache():null;this.key=openMeteoKey;this.fallbackKey=openWeatherKey;this.url=openMeteoUrl;this.breakers={nasa:new CircuitBreaker(),openmeteo:new CircuitBreaker(),openweather:new CircuitBreaker()};}
  async cached(key,fn){return this.cache?this.cache.get(key,fn):fn();}
  async climate(site){
    if(this.mode==='demo')return demoClimate();
    return this.cached(`climate:${site.latitude}:${site.longitude}`,()=>this.breakers.nasa.execute(async()=>{
      const url=new URL('https://power.larc.nasa.gov/api/temporal/climatology/point');url.search=new URLSearchParams({parameters:'ALLSKY_SFC_SW_DWN,T2M',community:'RE',latitude:site.latitude,longitude:site.longitude,format:'JSON'});
      const data=await jsonRequest(url,{timeoutMs:10000});const params=data.properties?.parameter;
      const ghi=MONTHS.map(m=>params?.ALLSKY_SFC_SW_DWN?.[m]),temp=MONTHS.map(m=>params?.T2M?.[m]);
      if(data.parameters?.ALLSKY_SFC_SW_DWN?.units!=='kW-hr/m^2/day'||!ghi.every(x=>validNumber(x,0,15))||!temp.every(x=>validNumber(x,-70,60)))throw new AppError(503,'INVALID_RESOURCE','NASA resource units or values are invalid');
      return {dailyGhiKwhM2:ghi,monthlyTempC:temp,source:'NASA POWER climatology',period:data.header?.title||'Provider climatology; see header',providerHeader:data.header,fetchedAt:new Date().toISOString(),warnings:['Climatological averages are approximate; local roof shading and interannual variability are not measured.']};
    }));
  }
  async forecast(site){
    const start=new Date(Math.floor(Date.now()/3600000)*3600000).toISOString(),end=new Date(Date.parse(start)+24*3600000).toISOString();
    const key=`forecast:${site.latitude}:${site.longitude}:${start}:${end}`;
    if(this.mode==='demo')return {source:'synthetic-demo',fetchedAt:new Date().toISOString(),start,end,warnings:['Synthetic hourly example; not a weather forecast.'],intervals:Array.from({length:24},(_,i)=>{const finish=new Date(Date.parse(start)+(i+1)*3600000),hour=(finish.getUTCHours()+site.longitude/15-.5+24)%24,ghi=Math.max(0,Math.sin((hour-6)/12*Math.PI))*800;return {end:finish.toISOString(),durationHours:1,ghiWm2:ghi,dniWm2:ghi*.8,dhiWm2:ghi*.25,tempC:28,windMs:2};})};
    return this.cached(key,async()=>{try{return await this.breakers.openmeteo.execute(async()=>{
      const url=new URL(this.url);url.search=new URLSearchParams({latitude:site.latitude,longitude:site.longitude,hourly:'shortwave_radiation,direct_normal_irradiance,diffuse_radiation,temperature_2m,wind_speed_10m',wind_speed_unit:'ms',timezone:'UTC',forecast_days:'3',...(this.key?{apikey:this.key}:{})});
      const data=await jsonRequest(url);return {source:'Open-Meteo',fetchedAt:new Date().toISOString(),start,end,intervals:parseOpenMeteo(data,start,end),warnings:['Hourly forecast; uncertainty is not a calibrated prediction interval.']};
    });}catch(primaryError){if(!this.fallbackKey)throw primaryError;return this.breakers.openweather.execute(()=>openWeatherForecast(site,this.fallbackKey,start,end));}});
  }
}
module.exports={WeatherService,parseOpenMeteo};
