from fastapi.testclient import TestClient
from app.main import app
from test_physics import SITE, CONFIG

client=TestClient(app)

def test_health_and_model():
    assert client.get('/health').status_code==200
    assert client.get('/model').json()['version']=='plant-linear-chrono-v1'

def test_plan_and_validation():
    body={'site':SITE,'scenario':CONFIG,'dailyGhiKwhM2':[5]*12,'monthlyTempC':[27]*12,'year':2026}
    assert client.post('/plan',json=body).status_code==200
    body['dailyGhiKwhM2']=[-5]*12
    assert client.post('/plan',json=body).status_code==422

def test_research_not_capacity_prediction():
    result=client.post('/research/predict',json={'irradiation':.5,'ambientC':28})
    assert result.status_code==200
    assert 'normalizedPlantOutput' in result.json()
    assert 'not rated-capacity' in result.json()['warning']
