// Creates structured CLI input; validates image digests before composing a shell command.
for(const name of ['API_IMAGE','ML_IMAGE'])if(!/^ghcr\.io\/[a-z0-9_./-]+@sha256:[a-f0-9]{64}$/.test(process.env[name]||''))throw Error(`Invalid ${name}`);
process.stdout.write(JSON.stringify({commands:[`/opt/sunyield/deploy/release.sh ${process.env.API_IMAGE} ${process.env.ML_IMAGE}`]}));
