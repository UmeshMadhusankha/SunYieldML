"""Rebuild the notebook's linear model with chronological evaluation and train-only scaling."""
import argparse
import hashlib
import json
from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error,mean_squared_error,r2_score

def train(data_dir,output):
    generation_path=Path(data_dir)/'Plant_1_Generation_Data.csv'
    weather_path=Path(data_dir)/'Plant_1_Weather_Sensor_Data.csv'
    generation=pd.read_csv(generation_path)
    weather=pd.read_csv(weather_path)
    generation['DATE_TIME']=pd.to_datetime(generation['DATE_TIME'],format='%d-%m-%Y %H:%M')
    weather['DATE_TIME']=pd.to_datetime(weather['DATE_TIME'],format='%Y-%m-%d %H:%M:%S')
    mean=generation.groupby('DATE_TIME',as_index=False)['AC_POWER'].mean()
    data=weather.merge(mean,on='DATE_TIME',how='inner').sort_values('DATE_TIME')
    data=data.dropna(subset=['IRRADIATION','AMBIENT_TEMPERATURE','AC_POWER'])
    cutoff=data['DATE_TIME'].max().normalize()-pd.Timedelta(days=6)
    mask=data['DATE_TIME']<cutoff
    reference=float(data.loc[mask,'AC_POWER'].max())
    x=np.column_stack([data['IRRADIATION'],data['IRRADIATION']*data['AMBIENT_TEMPERATURE']])
    y=data['AC_POWER'].values/reference
    scaler=StandardScaler().fit(x[mask])
    model=LinearRegression().fit(scaler.transform(x[mask]),y[mask])
    prediction=model.predict(scaler.transform(x[~mask]))
    baseline=LinearRegression().fit(x[mask,0:1],y[mask])
    base=baseline.predict(x[~mask,0:1])
    daylight=data.loc[~mask,'IRRADIATION'].values>.05
    def metrics(actual,pred):
        return {'r2':float(r2_score(actual,pred)),'maeFraction':float(mean_absolute_error(actual,pred)),'maePercentagePoints':float(mean_absolute_error(actual,pred)*100),'rmsePercentagePoints':float(np.sqrt(mean_squared_error(actual,pred))*100),'maeSourceUnits':float(mean_absolute_error(actual,pred)*reference)}
    evaluation={'split':'chronological: final seven calendar days held out','trainRows':int(mask.sum()),'testRows':int((~mask).sum()),'cutoff':cutoff.isoformat(),'allHours':metrics(y[~mask],prediction),'daytime':metrics(y[~mask][daylight],prediction[daylight]),'irradiationOnlyBaseline':metrics(y[~mask],base)}
    evaluation['maeReductionVsBaselinePct']=100*(1-evaluation['allHours']['maeFraction']/evaluation['irradiationOnlyBaseline']['maeFraction'])
    artifact={'version':'plant-linear-chrono-v1','mean':scaler.mean_.tolist(),'scale':scaler.scale_.tolist(),'coefficients':model.coef_.tolist(),'intercept':float(model.intercept_),'trainingPeakSourceUnits':reference,'evaluation':evaluation,'target':'Mean AC_POWER over available inverters at each timestamp divided by the training-set observed peak.','featureUnits':{'irradiation':'Native dataset sensor units; calibration not verified. Do not pass W/m² directly.','ambientC':'Degrees Celsius'},'dataset':{'source':'https://github.com/UmeshMadhusankha/SunYieldML','commit':'9d12923eb5d24257efdcbc20e179cff1d0e3d458','sha256':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in [generation_path,weather_path]},'mergedRows':len(data),'start':data.DATE_TIME.min().isoformat(),'end':data.DATE_TIME.max().isoformat()},'limitations':['Single plant, 34 days, no external-site validation.','Mean of available inverters can vary with missing telemetry.','The observed training peak is not a nameplate capacity or a household capacity factor.','Chronological holdout reduces temporal leakage; this is not evidence of long-term generalization.','No clipping during evaluation; inference returns the raw regression output.']}
    Path(output).parent.mkdir(parents=True,exist_ok=True)
    Path(output).write_text(json.dumps(artifact,indent=2)+'\n')
    print(json.dumps(evaluation,indent=2))

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--data-dir',required=True)
    parser.add_argument('--output',default='models/reference_model.json')
    args=parser.parse_args()
    train(args.data_dir,args.output)
