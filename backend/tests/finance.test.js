const { bill, financialPlan, integratePower } = require('../src/domain/finance');
const config = { monthlyConsumptionKwh: 1000, selfConsumptionPct: 60, importRate: 50, exportRate: 20, monthlyOperatingCost: 1000, panelCost: 1000000, inverterCost: 400000, installationCost: 400000, currency: 'LKR', tariffKind: 'flat' };
describe('solar finance acceptance cases', () => {
  test('600 generated, 360 consumed, 240 exported returns 21,800', () => {
    const result = financialPlan(Array(12).fill(600), config);
    expect(result.months[0]).toMatchObject({ selfConsumedKwh: 360, exportedKwh: 240, netBenefit: 21800 });
    expect(result.installationCost).toBe(1800000);
    expect(result.simplePaybackYears).toBeCloseTo(1800000 / (21800 * 12));
  });
  test('self-consumption never exceeds demand', () => expect(financialPlan(Array(12).fill(600), { ...config, monthlyConsumptionKwh: 100 }).months[0].selfConsumedKwh).toBe(100));
  test('zero generation cannot claim positive payback', () => expect(financialPlan(Array(12).fill(0), config).simplePaybackYears).toBeNull());
  test('negative net benefit cannot claim positive payback', () => expect(financialPlan(Array(12).fill(10), config).simplePaybackYears).toBeNull());
  test('zero capex has zero payback if benefit positive', () => expect(financialPlan(Array(12).fill(600), { ...config, panelCost: 0, inverterCost: 0, installationCost: 0 }).simplePaybackYears).toBe(0));
  test('stepped bill applies blocks progressively', () => expect(bill(150, { tariffKind: 'tiered', importBlocks: [{ upToKwh: 100, rate: 10 }, { upToKwh: null, rate: 20 }] })).toBe(2000));
  test('stepped savings use bill before minus after', () => {
    const r = financialPlan(Array(12).fill(100), { ...config, monthlyConsumptionKwh: 150, selfConsumptionPct: 100, monthlyOperatingCost: 0, tariffKind: 'tiered', importBlocks: [{ upToKwh: 100, rate: 10 }, { upToKwh: null, rate: 20 }] });
    expect(r.months[0].billSaving).toBe(1500);
  });
  test('rejects invalid energy and incomplete months', () => {
    expect(() => financialPlan([600], config)).toThrow();
    expect(() => financialPlan(Array(12).fill(-1), config)).toThrow();
    expect(() => financialPlan(Array(12).fill(NaN), config)).toThrow();
  });
  test('integrates kW over duration, not raw sum', () => expect(integratePower([{ powerKw: 5, durationHours: .5 }, { powerKw: 0, durationHours: 1 }])).toBe(2.5));
  test('rejects malformed or missing intervals', () => {
    expect(() => integratePower([])).toThrow();
    expect(() => integratePower([{ powerKw: -1, durationHours: 1 }])).toThrow();
    expect(() => integratePower([{ powerKw: 1, durationHours: 0 }])).toThrow();
  });
  test('rejects invalid finance inputs and malformed tariffs', () => {
    for (const key of ['monthlyConsumptionKwh','selfConsumptionPct','exportRate','monthlyOperatingCost','panelCost','inverterCost','installationCost']) expect(()=>financialPlan(Array(12).fill(600),{...config,[key]:-1})).toThrow();
    expect(()=>financialPlan(Array(12).fill(600),{...config,selfConsumptionPct:101})).toThrow();
    expect(()=>bill(-1,config)).toThrow();expect(()=>bill(100,{...config,importRate:NaN})).toThrow();
    for(const blocks of [[],[{upToKwh:10,rate:1}],[{upToKwh:100,rate:1},{upToKwh:50,rate:1},{upToKwh:null,rate:1}],[{upToKwh:null,rate:1},{upToKwh:null,rate:1}],[{upToKwh:null,rate:-1}]]) expect(()=>bill(10,{tariffKind:'tiered',importBlocks:blocks})).toThrow();
  });
});
