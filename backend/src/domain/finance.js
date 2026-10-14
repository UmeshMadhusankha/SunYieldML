'use strict';
const nonnegative = value => Number.isFinite(value) && value >= 0;
const round = n => Math.round((n + Number.EPSILON) * 100) / 100;
function bill(kwh, config) {
  if (!nonnegative(kwh)) throw new Error('Invalid consumption');
  if (config.tariffKind !== 'tiered') {
    if (!nonnegative(config.importRate)) throw new Error('Invalid import rate');
    return kwh * config.importRate;
  }
  const blocks = config.importBlocks;
  if (!Array.isArray(blocks) || !blocks.length || blocks.at(-1).upToKwh !== null) throw new Error('Tariff requires an open final block');
  let previous=0, amount=0;
  blocks.forEach((b, i) => {
    const end = b.upToKwh === null ? Infinity : b.upToKwh;
    if (!nonnegative(b.rate) || end <= previous || (end === Infinity && i !== blocks.length-1)) throw new Error('Invalid tariff blocks');
    amount += Math.max(0, Math.min(kwh, end) - previous) * b.rate;
    previous = end;
  });
  return amount;
}
function financialPlan(monthlyKwh, config) {
  if (!Array.isArray(monthlyKwh) || monthlyKwh.length !== 12 || !monthlyKwh.every(nonnegative)) throw new Error('Twelve finite monthly generation values required');
  for (const key of ['monthlyConsumptionKwh','selfConsumptionPct','exportRate','monthlyOperatingCost','panelCost','inverterCost','installationCost']) if (!nonnegative(config[key])) throw new Error(`Invalid ${key}`);
  if (config.selfConsumptionPct > 100) throw new Error('Self consumption must be 0–100%');
  const months = monthlyKwh.map((generatedKwh, i) => {
    const selfConsumedKwh = Math.min(config.monthlyConsumptionKwh, generatedKwh * config.selfConsumptionPct / 100);
    const exportedKwh = generatedKwh - selfConsumedKwh;
    const billBefore = bill(config.monthlyConsumptionKwh, config);
    const billAfter = bill(config.monthlyConsumptionKwh - selfConsumedKwh, config);
    const billSaving = billBefore - billAfter;
    const exportIncome = exportedKwh * config.exportRate;
    return {month:i+1,generatedKwh:round(generatedKwh),selfConsumedKwh:round(selfConsumedKwh),exportedKwh:round(exportedKwh),billBefore:round(billBefore),billAfter:round(billAfter),billSaving:round(billSaving),exportIncome:round(exportIncome),operatingCost:config.monthlyOperatingCost,netBenefit:round(billSaving+exportIncome-config.monthlyOperatingCost)};
  });
  const annualNetBenefit = round(months.reduce((sum,m)=>sum+m.netBenefit,0));
  const installationCost = config.panelCost+config.inverterCost+config.installationCost;
  return {schemaVersion:'finance-v1',currency:config.currency,months,installationCost,annualGenerationKwh:round(monthlyKwh.reduce((a,b)=>a+b,0)),annualNetBenefit,averageMonthlyBenefit:round(annualNetBenefit/12),simplePaybackYears:annualNetBenefit>0?installationCost/annualNetBenefit:null,assumptions:['User-supplied tariffs and quotes; fixed monthly demand and self-consumption fraction.','Simple payback excludes financing, discounting, degradation, taxes, incentives and equipment replacement.','Exports require an eligible connection and compensation arrangement.']};
}
function integratePower(intervals) {
  if (!Array.isArray(intervals)||!intervals.length) throw new Error('Intervals required');
  return intervals.reduce((sum,p)=>{if(!nonnegative(p.powerKw)||!Number.isFinite(p.durationHours)||p.durationHours<=0)throw new Error('Invalid interval');return sum+p.powerKw*p.durationHours;},0);
}
module.exports={bill,financialPlan,integratePower};
