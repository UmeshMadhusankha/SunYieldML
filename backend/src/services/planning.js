const {financialPlan}=require('../domain/finance');
const {AppError}=require('../lib/errors');
class PlanningService {
  constructor({repo,weather,ml}){this.repo=repo;this.weather=weather;this.ml=ml;}
  async owned(table,id,userId){const r=await this.repo.get(table,id,userId);if(!r)throw new AppError(404,'NOT_FOUND','Resource not found');return r;}
  async estimate(scenarioId,userId,year){const scenario=await this.owned('scenarios',scenarioId,userId);const site=await this.owned('sites',scenario.siteId,userId);const resource=await this.weather.climate(site);const prediction=await this.ml.plan({site,scenario,dailyGhiKwhM2:resource.dailyGhiKwhM2,monthlyTempC:resource.monthlyTempC,year});const financial=financialPlan(prediction.monthlyKwh,scenario);return this.repo.create('estimates',userId,{schemaVersion:'estimate-v1',year,siteSnapshot:site,scenarioSnapshot:scenario,resource,prediction,financial}, {siteId:site.id,scenarioId:scenario.id});}
  async forecast(siteId,scenarioId,userId){const site=await this.owned('sites',siteId,userId);const scenario=await this.owned('scenarios',scenarioId,userId);if(scenario.siteId!==siteId)throw new AppError(404,'NOT_FOUND','Scenario not found for site');const resource=await this.weather.forecast(site);const prediction=await this.ml.forecast({site,scenario,intervals:resource.intervals});return {resource,prediction};}
}
module.exports={PlanningService};
