const {jsonRequest}=require('./http');
const {AppError}=require('../lib/errors');
function normalizeOpenWeather(days,weather,start,end){
  const hourly=new Map((weather.hourly||[]).map(p=>[p.dt,p]));
  const solar=new Map();
  for(const day of days){
    if(day.tz!=='+00:00'||day.interval!=='1h'||!Array.isArray(day.intervals))throw new AppError(503,'INVALID_RESOURCE','OpenWeather hourly UTC data required');
    for(const p of day.intervals){if(!/^\d{2}:00$/.test(p.start))throw new AppError(503,'INVALID_RESOURCE','Unexpected solar interval');const timestamp=Date.parse(`${day.date}T${p.start}:00Z`);solar.set(timestamp,p.avg_irradiance?.cloudy_sky);}
  }
  const points=[];
  for(let t=Date.parse(start);t<Date.parse(end);t+=3600000){const s=solar.get(t),w=hourly.get(t/1000);if(!s||!w)throw new AppError(503,'INVALID_RESOURCE','OpenWeather window incomplete');const p={end:new Date(t+3600000).toISOString(),durationHours:1,ghiWm2:s.ghi,dniWm2:s.dni,dhiWm2:s.dhi,tempC:w.temp,windMs:w.wind_speed};for(const k of ['ghiWm2','dniWm2','dhiWm2','tempC','windMs'])if(!Number.isFinite(p[k]))throw new AppError(503,'INVALID_RESOURCE','Invalid fallback values');if(['ghiWm2','dniWm2','dhiWm2'].some(k=>p[k]<0||p[k]>2000)||p.tempC<-90||p.tempC>70||p.windMs<0||p.windMs>150)throw new AppError(503,'INVALID_RESOURCE','Fallback values outside supported range');points.push(p);}
  return points;
}
async function openWeatherForecast(site,key,start,end){
  const dates=new Set();for(let t=Date.parse(start);t<Date.parse(end);t+=3600000)dates.add(new Date(t).toISOString().slice(0,10));
  const solarUrls=[...dates].map(date=>{const u=new URL('https://api.openweathermap.org/energy/2.0/solar/interval_data');u.search=new URLSearchParams({lat:site.latitude,lon:site.longitude,date,interval:'1h',tz:'+00:00',appid:key});return u;});
  const url=new URL('https://api.openweathermap.org/data/3.0/onecall');url.search=new URLSearchParams({lat:site.latitude,lon:site.longitude,units:'metric',exclude:'current,minutely,daily,alerts',appid:key});
  const [days,weather]=await Promise.all([Promise.all(solarUrls.map(u=>jsonRequest(u))),jsonRequest(url)]);
  return {intervals:normalizeOpenWeather(days,weather,start,end),source:'OpenWeather Solar 2.0 + One Call 3.0',fetchedAt:new Date().toISOString(),start,end,warnings:['Primary forecast unavailable; independent OpenWeather fallback in use.','Hourly point temperature and wind are held constant over the matching solar-average interval.']};
}
module.exports={openWeatherForecast,normalizeOpenWeather};
