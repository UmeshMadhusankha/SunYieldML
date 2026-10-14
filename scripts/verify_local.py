"""Dependency-free and installed-runtime checks; explicitly does not replace Jest/build/integration."""
import ast
import json
import subprocess
from pathlib import Path
import yaml

root=Path(__file__).resolve().parent.parent
results=[]

def check(name,command,cwd=root):
    result=subprocess.run(command,cwd=cwd,text=True,capture_output=True)
    results.append({'name':name,'command':command,'exitCode':result.returncode,'passed':result.returncode==0,'output':result.stdout+result.stderr})

check('Node native acceptance checks',['node','--test','backend/tests/native.test.cjs'])
check('Python portable model checks',['python','-m','unittest','discover','-s','tests','-p','test_research_native.py','-v'],root/'ml-service')
js_files=list((root/'backend').rglob('*.js'))+list((root/'backend').rglob('*.cjs'))+list((root/'frontend').glob('*.js'))+list((root/'frontend').glob('*.cjs'))+list((root/'frontend/src/lib').glob('*.js'))+list((root/'scripts').glob('*.cjs'))+list((root/'deploy').glob('*.js'))+list((root/'benchmarks').glob('*.js'))
for path in js_files:
    check(f'JavaScript syntax: {path.relative_to(root)}',['node','--check',str(path)])
for path in list((root/'ml-service').rglob('*.py'))+[Path(__file__)]:
    try:
        ast.parse(path.read_text())
        results.append({'name':f'Python syntax: {path.relative_to(root)}','passed':True})
    except SyntaxError as e:
        results.append({'name':f'Python syntax: {path.relative_to(root)}','passed':False,'output':str(e)})
for path in list((root/'.github/workflows').glob('*.yml'))+[root/'compose.yaml',root/'deploy/compose.production.yaml']:
    try:
        data=yaml.load(path.read_text(),Loader=yaml.BaseLoader)
        assert isinstance(data,dict)
        if path.parent.name=='workflows':
            assert 'on' in data and data['jobs']
        else:
            assert data['services']
        results.append({'name':f'YAML parse: {path.relative_to(root)}','passed':True})
    except Exception as e:
        results.append({'name':f'YAML parse: {path.relative_to(root)}','passed':False,'output':str(e)})
for path in [root/'frontend/package.json',root/'backend/package.json',root/'ml-service/models/reference_model.json',root/'deploy/oidc-trust.example.json',root/'deploy/deploy-policy.example.json']:
    try:
        json.loads(path.read_text())
        results.append({'name':f'JSON parse: {path.relative_to(root)}','passed':True})
    except ValueError as e:
        results.append({'name':f'JSON parse: {path.relative_to(root)}','passed':False,'output':str(e)})
check('Release shell syntax',['bash','-n','deploy/release.sh'])
report={'checks':results,'passed':all(r['passed'] for r in results),'notExecuted':['Jest and Testing Library','React/Vite build and JSX compilation','FastAPI/pvlib pytest suites','PostgreSQL integration','Docker image builds and compose health checks','Live weather requests','k6 HTTP load test','GitHub Actions and AWS deployment']}
(root/'evidence').mkdir(exist_ok=True)
(root/'evidence/local-verification.json').write_text(json.dumps(report,indent=2)+'\n')
print(f"{sum(r['passed'] for r in results)}/{len(results)} checks passed; JSX/build and dependency suites remain unverified")
for r in results:
    if not r['passed']:
        print(r['name'],r.get('output',''))
raise SystemExit(0 if report['passed'] else 1)
