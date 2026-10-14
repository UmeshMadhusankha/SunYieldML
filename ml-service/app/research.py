"""Portable preprocessing + linear coefficients, safe JSON; no pickle loading."""
import json
import math
from pathlib import Path

class ResearchModel:
    def __init__(self,path=None):
        self.artifact=json.loads(Path(path or Path(__file__).parent.parent/'models/reference_model.json').read_text())
    def predict(self,irradiation,ambient_c):
        if not math.isfinite(irradiation) or not 0<=irradiation<=1.5 or not math.isfinite(ambient_c) or not 0<=ambient_c<=60:
            raise ValueError('Features outside research input contract')
        raw=[irradiation,irradiation*ambient_c]
        a=self.artifact
        scaled=[(v-mu)/sd for v,mu,sd in zip(raw,a['mean'],a['scale'])]
        prediction=a['intercept']+sum(v*w for v,w in zip(scaled,a['coefficients']))
        return {'normalizedPlantOutput':prediction,'version':a['version'],'warning':'Research plant mean-inverter output normalized to training peak; not rated-capacity yield for a new installation.'}
    def metadata(self):
        return {k:self.artifact[k] for k in ('version','evaluation','target','featureUnits','dataset','limitations')}
