// Bootstrap without a lockfile; once a lockfile is committed, use npm ci.
const {existsSync}=require('node:fs');
const {spawnSync}=require('node:child_process');
const path=require('node:path');
const folder=process.argv[2];
if(!['frontend','backend'].includes(folder))throw Error('Usage: node scripts/install.cjs frontend|backend');
const cwd=path.join(__dirname,'..',folder),locked=existsSync(path.join(cwd,'package-lock.json'));
if(!locked)console.warn(`${folder}: bootstrap npm install. Commit the generated package-lock.json before your first release.`);
const r=spawnSync('npm',[locked?'ci':'install','--no-audit','--no-fund'],{cwd,stdio:'inherit'});if(r.error)console.error(r.error.message);process.exit(r.status??1);
