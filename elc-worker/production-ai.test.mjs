import assert from 'node:assert/strict';
import {productionAiConfig,claudeSchema,requestProductionBlueprint,validateAiShape} from './production-ai.js';
const schema={type:'object',additionalProperties:false,required:['screens'],properties:{screens:{type:'array',minItems:2,maxItems:3,items:{type:'string'}}}};
const value={screens:['Обращения','Клиенты']};
const env={ANTHROPIC_API_KEY:'fake-claude-key',OPENAI_API_KEY:'fake-openai-key'};
assert.deepEqual(productionAiConfig({},{}),{provider:'openai',model:'gpt-6-sol'});
assert.equal(productionAiConfig({}, {aiProvider:'anthropic'}).model,'claude-opus-5-5');
assert.throws(()=>productionAiConfig({}, {aiProvider:'other'}),/провайдер/);
const transformed=claudeSchema(schema);
assert.equal(transformed.properties.screens.minItems,undefined);
assert.equal(schema.properties.screens.minItems,2);
assert.throws(()=>validateAiShape({screens:['x']},schema),/число/);
assert.throws(()=>validateAiShape({screens:[1,2]},schema),/тип/);
assert.throws(()=>validateAiShape({...value,extra:true},schema),/лишнее/);
const config={provider:'anthropic',model:'claude-opus-5-5'};
let calls=0;
const mock=async(url,options)=>{
 calls++;
 assert.equal(url,'https://api.anthropic.com/v1/messages');
 assert.equal(options.headers['x-api-key'],env.ANTHROPIC_API_KEY);
 assert.equal(options.headers.Authorization,undefined);
 const body=JSON.parse(options.body);
 assert.equal(body.model,config.model);
 assert.equal(body.messages[0].content,'test meeting');
 assert.deepEqual(body.output_config.format.schema,transformed);
 return Response.json({id:'msg_test',model:config.model,stop_reason:'end_turn',content:[{type:'text',text:JSON.stringify(value)}],usage:{input_tokens:10,output_tokens:20}});
};
const result=await requestProductionBlueprint(env,config,'test meeting',schema,mock);
assert.deepEqual(result.blueprint,value);
assert.equal(result.generation.provider,'anthropic');
assert.equal(result.generation.requestId,'msg_test');
assert.equal(calls,1);
await assert.rejects(()=>requestProductionBlueprint({},config,'',schema,()=>{throw Error('must not call');}),/ANTHROPIC_API_KEY/);
await assert.rejects(()=>requestProductionBlueprint(env,config,'',schema,async()=>Response.json({error:{message:'secret body'}},{status:401})),e=>/401/.test(e.message)&&!e.message.includes('secret body'));
for (const [message, hint] of [
 ['Streaming is required for this request: private prompt', 'потоковый'],
 ['Your credit balance is too low: private account', 'API-кредитов'],
 ['Invalid output_config schema: private data', 'схему'],
 ['Unrecognized model: private model', 'модель недоступна'],
 ['Unknown error with private data', 'параметры запроса'],
]) {
 await assert.rejects(()=>requestProductionBlueprint(env,config,'',schema,async()=>Response.json({error:{message}},{status:400})),e=>e.message.includes(hint)&&!e.message.includes('private'));
}
await assert.rejects(()=>requestProductionBlueprint(env,config,'',schema,async()=>Response.json({stop_reason:'max_tokens',content:[]})),/лимит длины/);
await assert.rejects(()=>requestProductionBlueprint(env,config,'',schema,async()=>Response.json({stop_reason:'refusal',content:[]})),/не завершён/);
const openai=await requestProductionBlueprint(env,{provider:'openai',model:'gpt-6-sol'},'test',schema,async(url,options)=>{
 assert.equal(url,'https://api.openai.com/v1/responses');
 assert.equal(options.headers.Authorization,'Bearer fake-openai-key');
 assert.equal(options.headers['x-api-key'],undefined);
 return Response.json({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify(value)}]}]});
});
assert.deepEqual(openai.blueprint,value);
console.log('production-ai tests passed');
