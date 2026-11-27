import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('./worker.js',import.meta.url),'utf8');
function fixture(){
 let jwtCalls=0;
 const json=(data,status)=>Response.json(data,{status});
 const ctx=vm.createContext({URL,json,requestClaims:async(_req,token)=>{jwtCalls++;if(token==='viewer-jwt')return{email:'viewer@example.com'};throw Error('not a JWT');},restrictedViewer:async()=>({mode:'astana-readonly'}),viewerRequestAllowed:r=>r.method==='GET'&&['/api/me','/api/astana-view'].includes(new URL(r.url).pathname),handleAstanaViewer:async()=>json({viewer:true},200)});
 const start=source.indexOf('    // Ограниченный наблюдатель'),end=source.indexOf('    // Чистые публичные',start);
 const fnStart=source.indexOf('async function handleSkillsReport('),fnEnd=source.indexOf('\n}\n',fnStart)+3;
 vm.runInContext(source.slice(fnStart,fnEnd),ctx);
 vm.runInContext('async function dispatch(request,env){const url=new URL(request.url),path=url.pathname;'+source.slice(start,end)+"if(path==='/api/skills/report'&&request.method==='POST')return handleSkillsReport(request,env);return json({other:true},200);}",ctx);
 const request=(token,path='/api/skills/report',method='POST')=>new Request('https://test'+path,{method,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},...(method==='POST'?{body:'{}'}:{})});
 const env={SKILLS_INGEST_SECRET:'service-secret',DB:{prepare(){throw Error('must not write');}}};
 return {ctx,request,env,jwtCalls:()=>jwtCalls};
}
test('Skills Bearer reaches its own shared-secret check, not JWT verification',async()=>{const f=fixture();const r=await f.ctx.dispatch(f.request('service-secret'),f.env);assert.equal(r.status,400);assert.equal((await r.json()).error,'text required');assert.equal(f.jwtCalls(),0);});
test('invalid service credentials and observer JWT cannot write Skills reports',async()=>{const f=fixture();for(const token of ['wrong','viewer-jwt']){const r=await f.ctx.dispatch(f.request(token),f.env);assert.equal(r.status,401);assert.equal((await r.json()).error,'invalid token');}assert.equal(f.jwtCalls(),0);delete f.env.SKILLS_INGEST_SECRET;assert.equal((await f.ctx.dispatch(f.request('service-secret'),f.env)).status,503);});
test('only the exact POST ingestion route bypasses staff JWT classification',async()=>{const f=fixture();for(const [path,method]of [['/api/deals','POST'],['/api/skills/report/extra','POST'],['/api/skills/report','GET']]){const r=await f.ctx.dispatch(f.request('service-secret',path,method),f.env);assert.equal(r.status,401);assert.equal((await r.json()).error,'invalid auth token');}assert.equal(f.jwtCalls(),3);});
test('restricted observers remain denied on other writes and permitted only on viewer GETs',async()=>{const f=fixture();assert.equal((await f.ctx.dispatch(f.request('viewer-jwt','/api/deals'),f.env)).status,403);assert.equal((await f.ctx.dispatch(f.request('viewer-jwt','/api/astana-view','GET'),f.env)).status,200);});
