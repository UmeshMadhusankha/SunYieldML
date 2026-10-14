import hmac
import os
from typing import Annotated
from fastapi import FastAPI, Header, HTTPException, Depends
from pydantic import BaseModel, ConfigDict, Field
from .physics import monthly_plan, forecast_power
from .research import ResearchModel

app=FastAPI(title='SunYield internal inference',version='1.0.0',docs_url=None,redoc_url=None)
model=ResearchModel()
service_key=os.environ.get('ML_SERVICE_KEY','')

def authorize(x_service_key:Annotated[str|None,Header()]=None):
    if service_key and not hmac.compare_digest(x_service_key or '',service_key):
        raise HTTPException(401,'Invalid service key')

class Site(BaseModel):
    model_config=ConfigDict(extra='ignore')
    latitude:float=Field(ge=-89,le=89,allow_inf_nan=False)
    longitude:float=Field(ge=-180,le=180,allow_inf_nan=False)
    timezone:str=Field(max_length=80)

class Scenario(BaseModel):
    model_config=ConfigDict(extra='ignore')
    capacityKwp:float=Field(gt=0,le=100000,allow_inf_nan=False)
    inverterKw:float=Field(gt=0,le=100000,allow_inf_nan=False)
    tiltDeg:float=Field(ge=0,le=90,allow_inf_nan=False)
    azimuthDeg:float=Field(ge=0,le=360,allow_inf_nan=False)
    lossPct:float=Field(ge=0,le=99,allow_inf_nan=False)
    shadingPct:float=Field(ge=0,le=100,allow_inf_nan=False)

class Plan(BaseModel):
    model_config=ConfigDict(extra='forbid')
    site:Site
    scenario:Scenario
    dailyGhiKwhM2:list[float]=Field(min_length=12,max_length=12)
    monthlyTempC:list[float]=Field(min_length=12,max_length=12)
    year:int=Field(ge=2020,le=2100)

class Interval(BaseModel):
    model_config=ConfigDict(extra='forbid')
    end:str
    durationHours:float=Field(ge=1,le=1)
    ghiWm2:float=Field(ge=0,le=2000,allow_inf_nan=False)
    dniWm2:float=Field(ge=0,le=2000,allow_inf_nan=False)
    dhiWm2:float=Field(ge=0,le=2000,allow_inf_nan=False)
    tempC:float=Field(ge=-90,le=70,allow_inf_nan=False)
    windMs:float=Field(ge=0,le=150,allow_inf_nan=False)

class Forecast(BaseModel):
    model_config=ConfigDict(extra='forbid')
    site:Site
    scenario:Scenario
    intervals:list[Interval]=Field(min_length=1,max_length=168)

class Features(BaseModel):
    model_config=ConfigDict(extra='forbid')
    irradiation:float=Field(ge=0,le=1.5,allow_inf_nan=False)
    ambientC:float=Field(ge=0,le=60,allow_inf_nan=False)

@app.get('/health',dependencies=[Depends(authorize)])
def health():
    return {'status':'ready','modelVersion':model.artifact['version']}

@app.get('/model',dependencies=[Depends(authorize)])
def metadata():
    return model.metadata()

@app.post('/plan',dependencies=[Depends(authorize)])
def plan(body:Plan):
    try:
        return monthly_plan(body.site.model_dump(),body.scenario.model_dump(),body.dailyGhiKwhM2,body.monthlyTempC,body.year)
    except (ValueError,KeyError) as e:
        raise HTTPException(422,str(e)) from e

@app.post('/forecast',dependencies=[Depends(authorize)])
def forecast(body:Forecast):
    try:
        return forecast_power(body.site.model_dump(),body.scenario.model_dump(),[p.model_dump() for p in body.intervals])
    except (ValueError,KeyError) as e:
        raise HTTPException(422,str(e)) from e

@app.post('/research/predict',dependencies=[Depends(authorize)])
def research(body:Features):
    return model.predict(body.irradiation,body.ambientC)
