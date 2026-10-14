const schemas=require('../domain/schemas');
const {AppError}=require('../lib/errors');
const {bill}=require('../domain/finance');
function siteController({repo,planning,validate}){return {
  list:async(req,res)=>res.json(await repo.list('sites',req.user.id)),
  create:async(req,res)=>res.status(201).json(await repo.create('sites',req.user.id,validate(schemas.site,req.body))),
  get:async(req,res)=>res.json(await planning.owned('sites',req.params.id,req.user.id)),
  update:async(req,res)=>{const old=await planning.owned('sites',req.params.id,req.user.id);const {id:_id,ownerId:_ownerId,createdAt:_createdAt,...data}=old;const updated=validate(schemas.site,{...data,...validate(schemas.site.partial(),req.body)});const existing=await repo.list('scenarios',req.user.id,old.id);if(existing.some(s=>s.capacityKwp>updated.roofAreaM2*.2))throw new AppError(422,'ROOF_CAPACITY','Roof area is too small for an existing scenario');res.json(await repo.updateSite(old.id,req.user.id,updated));},
  delete:async(req,res)=>{await planning.owned('sites',req.params.id,req.user.id);await repo.deleteSite(req.params.id,req.user.id);res.sendStatus(204);},
  scenarios:async(req,res)=>{await planning.owned('sites',req.params.id,req.user.id);res.json(await repo.list('scenarios',req.user.id,req.params.id));},
  createScenario:async(req,res)=>{const site=await planning.owned('sites',req.params.id,req.user.id),data=validate(schemas.scenario,req.body);if(data.capacityKwp>site.roofAreaM2*.2)throw new AppError(422,'ROOF_CAPACITY','Capacity exceeds assumed roof density of 0.2 kWp/m²');try{bill(data.monthlyConsumptionKwh,data);}catch(e){throw new AppError(422,'INVALID_TARIFF',e.message);}res.status(201).json(await repo.create('scenarios',req.user.id,data,{siteId:site.id}));},
  estimates:async(req,res)=>{await planning.owned('sites',req.params.id,req.user.id);res.json(await repo.list('estimates',req.user.id,req.params.id));},
  estimate:async(req,res)=>{const data=validate(schemas.z.object({year:schemas.z.number().int().min(2020).max(2100).optional()}).strict(),req.body);res.status(201).json(await planning.estimate(req.params.id,req.user.id,data.year||new Date().getFullYear()));},
  getEstimate:async(req,res)=>res.json(await planning.owned('estimates',req.params.id,req.user.id)),
  forecast:async(req,res)=>{const data=validate(schemas.z.object({scenarioId:schemas.z.string().uuid()}).strict(),req.body);res.json(await planning.forecast(req.params.id,data.scenarioId,req.user.id));}
};}
module.exports={siteController};
