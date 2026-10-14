import pytest
from app.physics import monthly_plan, forecast_power

CONFIG = dict(capacityKwp=5, inverterKw=4, tiltDeg=15, azimuthDeg=180, lossPct=14, shadingPct=0)
SITE = dict(latitude=6.9271, longitude=79.8612, timezone='Asia/Colombo')

def test_monthly_plan_has_twelve_positive_months():
    result = monthly_plan(SITE, CONFIG, [5.0] * 12, [27.0] * 12, 2026)
    assert len(result['monthlyKwh']) == 12
    assert all(v > 0 for v in result['monthlyKwh'])
    assert result['engine'] == 'pv-physics-v1'

def test_zero_sun_means_zero_energy():
    assert monthly_plan(SITE, CONFIG, [0] * 12, [27] * 12, 2026)['monthlyKwh'] == [0] * 12

def test_larger_capacity_generates_more_with_sufficient_inverter():
    small = monthly_plan(SITE, {**CONFIG, 'inverterKw': 10}, [5]*12, [27]*12, 2026)
    big = monthly_plan(SITE, {**CONFIG, 'capacityKwp': 10, 'inverterKw': 10}, [5]*12, [27]*12, 2026)
    assert sum(big['monthlyKwh']) == pytest.approx(2 * sum(small['monthlyKwh']), rel=.01)

def test_night_output_is_zero_and_day_output_is_capped():
    night = [dict(end='2026-10-14T00:00:00Z', ghiWm2=1000, dniWm2=1000, dhiWm2=250, tempC=27, windMs=1, durationHours=1)]
    day = [dict(end='2026-10-14T07:00:00Z', ghiWm2=1200, dniWm2=1100, dhiWm2=250, tempC=30, windMs=1, durationHours=1)]
    assert forecast_power(SITE, CONFIG, night)['points'][0]['powerKw'] == 0
    assert 0 < forecast_power(SITE, CONFIG, day)['points'][0]['powerKw'] <= CONFIG['inverterKw']

def test_forecast_rejects_gaps_and_invalid_weather():
    p=dict(end='2026-10-14T07:00:00Z', ghiWm2=500, dniWm2=600, dhiWm2=100, tempC=28, windMs=2, durationHours=1)
    with pytest.raises(ValueError):
        forecast_power(SITE, CONFIG, [p,{**p,'end':'2026-10-14T09:00:00Z'}])
    with pytest.raises(ValueError):
        forecast_power(SITE, CONFIG, [{**p,'ghiWm2':-1}])

def test_full_shading_yields_zero():
    result = monthly_plan(SITE, {**CONFIG, 'shadingPct': 100}, [5]*12, [27]*12, 2026)
    assert result['monthlyKwh'] == [0] * 12
