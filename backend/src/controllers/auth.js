const schemas=require('../domain/schemas');
const {AppError}=require('../lib/errors');
const {hashPassword,verifyPassword,token,hashToken}=require('../lib/auth');
const publicUser=u=>({id:u.id,name:u.name,email:u.email,accountType:u.accountType});
function authController({repo,config,validate}){
  const options={httpOnly:true,sameSite:'lax',secure:config.production,path:'/',maxAge:7*86400000};
  async function session(req,res,user){if(typeof req.cookies.sid==='string')await repo.deleteSession(hashToken(req.cookies.sid));const raw=token(),csrf=token();await repo.saveSession({id:hashToken(raw),userId:user.id,csrf,expiresAt:new Date(Date.now()+options.maxAge).toISOString()});res.cookie('sid',raw,options);return {user:publicUser(user),csrfToken:csrf};}
  return {
    register:async(req,res)=>{const data=validate(schemas.registration,req.body);try{const user=await repo.createUser({name:data.name,email:data.email,accountType:data.accountType,passwordHash:await hashPassword(data.password)});res.status(201).json(await session(req,res,user));}catch(e){if(e.code==='23505')throw new AppError(409,'ACCOUNT_EXISTS','Email is already registered');throw e;}},
    login:async(req,res)=>{const data=validate(schemas.login,req.body);const u=await repo.findUser(data.email);if(!u||!await verifyPassword(data.password,u.passwordHash))throw new AppError(401,'INVALID_CREDENTIALS','Email or password is incorrect');res.json(await session(req,res,u));},
    me:async(req,res)=>res.json({user:publicUser(req.user),csrfToken:req.session.csrf}),
    logout:async(req,res)=>{await repo.deleteSession(req.session.id);res.clearCookie('sid',{...options,maxAge:undefined});res.sendStatus(204);}
  };
}
module.exports={authController};
