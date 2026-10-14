const {randomBytes,scrypt,timingSafeEqual,createHash}=require('node:crypto');
const {promisify}=require('node:util');
const derive=promisify(scrypt);
const token=()=>randomBytes(32).toString('hex');
const hashToken=value=>createHash('sha256').update(value).digest('hex');
async function hashPassword(password){const salt=randomBytes(16).toString('hex');const key=await derive(password,salt,64);return `${salt}:${key.toString('hex')}`;}
async function verifyPassword(password,hash){const [salt,expected]=hash.split(':');const key=await derive(password,salt,64);const bytes=Buffer.from(expected,'hex');return bytes.length===key.length&&timingSafeEqual(bytes,key);}
function safeEqual(a,b){if(typeof a!=='string'||typeof b!=='string')return false;const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y);}
module.exports={token,hashToken,hashPassword,verifyPassword,safeEqual};
