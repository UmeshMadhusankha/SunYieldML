"""Capacity-based PV planning. This does not reuse the plant's normalized ML output."""
import calendar
import math
import numpy as np
import pandas as pd
import pvlib

ASSUMPTIONS = [
    'Monthly energy uses one representative clear-sky-shaped day scaled to each monthly daily GHI; not a historical hourly simulation.',
    'Fixed array, isotropic diffuse transposition, albedo 0.2; no tracking, horizon or spatial shading simulation.',
    'Faiman temperature model u0=25 u1=6.84; temperature coefficient -0.004/°C; constant inverter efficiency 96%.',
    'User loss and shading percentages apply to DC output before inverter clipping.',
    'Results are screening estimates; not a bankable design or a calibrated uncertainty interval.',
]

def validate_config(site, config):
    for name in ('latitude', 'longitude'):
        if not math.isfinite(site[name]):
            raise ValueError('Non-finite location')
    if not -89 <= site['latitude'] <= 89 or not -180 <= site['longitude'] <= 180:
        raise ValueError('Location outside supported range')
    ranges = {'capacityKwp':(0,100000), 'inverterKw':(0,100000), 'tiltDeg':(0,90), 'azimuthDeg':(0,360), 'lossPct':(0,99), 'shadingPct':(0,100)}
    for name, (low,high) in ranges.items():
        v=config[name]
        if not math.isfinite(v) or not low <= v <= high or (name in ('capacityKwp','inverterKw') and v == 0):
            raise ValueError(f'Invalid {name}')

def _power(site, config, times, ghi, dni, dhi, temp, wind):
    position=pvlib.solarposition.get_solarposition(times, site['latitude'], site['longitude'])
    poa=pvlib.irradiance.get_total_irradiance(config['tiltDeg'],config['azimuthDeg'],position['apparent_zenith'],position['azimuth'],dni,ghi,dhi,albedo=.2,model='isotropic')['poa_global']
    poa=np.maximum(np.nan_to_num(np.asarray(poa),nan=0.0),0)
    cell=pvlib.temperature.faiman(poa,np.asarray(temp),np.asarray(wind),u0=25,u1=6.84)
    dc=pvlib.pvsystem.pvwatts_dc(poa,cell,pdc0=config['capacityKwp'],gamma_pdc=-.004)
    ac=np.clip(dc*(1-config['lossPct']/100)*(1-config['shadingPct']/100)*.96,0,config['inverterKw'])
    return np.where((np.asarray(position['apparent_zenith'])>=90)|(np.asarray(ghi)<=0),0,ac)

def monthly_plan(site, config, daily_ghi, monthly_temp, year):
    validate_config(site,config)
    if len(daily_ghi)!=12 or len(monthly_temp)!=12 or not 2020<=year<=2100:
        raise ValueError('Twelve months and supported year required')
    if any(not math.isfinite(x) or not 0<=x<=15 for x in daily_ghi) or any(not math.isfinite(x) or not -70<=x<=60 for x in monthly_temp):
        raise ValueError('Invalid climate values')
    location=pvlib.location.Location(site['latitude'],site['longitude'],tz=site['timezone'])
    energy=[]
    for month in range(1,13):
        times=pd.date_range(f'{year}-{month:02d}-15 00:30',periods=24,freq='h',tz=site['timezone'])
        clear=location.get_clearsky(times,model='ineichen')
        reference=float(clear['ghi'].sum())/1000
        if daily_ghi[month-1]==0:
            energy.append(0.0)
            continue
        if reference<=0:
            raise ValueError('Representative day has no sunlight; hourly resources required at this latitude')
        scale=daily_ghi[month-1]/reference
        power=_power(site,config,times,clear['ghi'].values*scale,clear['dni'].values*scale,clear['dhi'].values*scale,[monthly_temp[month-1]]*24,[2.0]*24)
        energy.append(round(float(power.sum())*calendar.monthrange(year,month)[1],2))
    return {'monthlyKwh':energy,'engine':'pv-physics-v1','libraryVersion':pvlib.__version__,'assumptions':ASSUMPTIONS}

def forecast_power(site,config,intervals):
    validate_config(site,config)
    if not intervals or len(intervals)>168:
        raise ValueError('One to 168 hourly intervals required')
    ends=pd.to_datetime([p['end'] for p in intervals],utc=True)
    durations=np.array([p['durationHours'] for p in intervals],dtype=float)
    if not np.all(np.isfinite(durations)) or np.any(durations!=1) or not ends.is_monotonic_increasing or ends.has_duplicates:
        raise ValueError('Ordered hourly intervals required')
    if len(ends)>1 and not np.all(np.diff(ends.asi8)==3600*10**9):
        raise ValueError('Intervals must be contiguous')
    arrays={key:np.array([p[key] for p in intervals],dtype=float) for key in ('ghiWm2','dniWm2','dhiWm2','tempC','windMs')}
    if any(not np.all(np.isfinite(v)) for v in arrays.values()):
        raise ValueError('Non-finite weather')
    if any(np.any((arrays[key]<0)|(arrays[key]>2000)) for key in ('ghiWm2','dniWm2','dhiWm2')) or np.any((arrays['tempC']<-90)|(arrays['tempC']>70)) or np.any((arrays['windMs']<0)|(arrays['windMs']>150)):
        raise ValueError('Invalid weather range')
    midpoint=ends-pd.to_timedelta(durations/2,unit='h')
    power=_power(site,config,midpoint,arrays['ghiWm2'],arrays['dniWm2'],arrays['dhiWm2'],arrays['tempC'],arrays['windMs'])
    points=[{'end':p['end'],'start':(ends[i]-pd.Timedelta(hours=1)).isoformat(),'durationHours':1,'powerKw':round(float(power[i]),5),'energyKwh':round(float(power[i]),5)} for i,p in enumerate(intervals)]
    return {'points':points,'totalKwh':round(float(np.dot(power,durations)),3),'engine':'pv-physics-v1','assumptions':ASSUMPTIONS[1:]+['Radiation is the preceding-hour mean; solar position evaluated at interval midpoint.']}
