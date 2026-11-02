import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {skillRoot,hash,readJson,sourceRoot,fail} from './common.mjs';
import {gate} from './contract.mjs';

// Strict JSON parsing rejects duplicate keys instead of silently accepting the final value.
export function parseStrict(text){
 let p=0;const ws=()=>{while(/[\t\r\n ]/.test(text[p]??'x'))p++;};
 function value(depth=0){
  if(depth>128)throw Error('json_too_deep');ws();const c=text[p];
  if(c==='"'){let end=p+1;for(;end<text.length;end++){if(text[end]==='\\'){end++;continue;}if(text[end]==='"')break;}const s=JSON.parse(text.slice(p,end+1));p=end+1;if(!s.isWellFormed())throw Error('invalid_unicode');return s;}
  if(c==='{'){p++;ws();const out=Object.create(null),seen=new Set();if(text[p]==='}'){p++;return out;}while(true){ws();if(text[p]!=='"')throw Error('invalid_json');const key=value(depth+1);if(seen.has(key))throw Error('duplicate_json_key');seen.add(key);ws();if(text[p++]!==':')throw Error('invalid_json');out[key]=value(depth+1);ws();const next=text[p++];if(next==='}')return out;if(next!==',')throw Error('invalid_json');}}
  if(c==='['){p++;ws();const out=[];if(text[p]===']'){p++;return out;}while(true){out.push(value(depth+1));ws();const next=text[p++];if(next===']')return out;if(next!==',')throw Error('invalid_json');}}
  const token=text.slice(p).match(/^(?:true|false|null|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)/)?.[0];if(!token)throw Error('invalid_json');p+=token.length;const v=JSON.parse(token);if(typeof v==='number'&&!Number.isSafeInteger(v))throw Error('unsafe_json_number');return v;
 }
 const parsed=value();ws();if(p!==text.length)throw Error('invalid_json');return parsed;
}
const keys=(obj,expected,label)=>{if(!obj||Array.isArray(obj)||typeof obj!=='object'||Object.keys(obj).sort().join('|')!==[...expected].sort().join('|'))throw Error('unexpected_or_missing_fields:'+label);};
export function preflight(text,context){
 try{
  if(Buffer.byteLength(text,'utf8')>1024*1024)throw Error('file_too_large');
  if(!text.isWellFormed())throw Error('invalid_unicode');
  if(!context||typeof context.bot_id!=='string'||!context.bot_id.trim()||!['en','zh-CN'].includes(context.language))throw Error('invalid_bot_context');
  const v=parseStrict(text);
  keys(v,['envelope_version','rule','template','test_input'],'envelope');
  if(v.envelope_version!==1)throw Error('unsupported_envelope_version');
  keys(v.rule,['id','version','position','name','groups','templateRef','action','enabled','executionMode','grant'],'rule');
  keys(v.rule.templateRef,['id','version'],'templateRef');
  keys(v.rule.action,['type','connectionId'],'action');
  keys(v.template,['id','version','instruction','outputPreferences'],'template');
  keys(v.template.outputPreferences,['language','format'],'outputPreferences');
  keys(v.test_input,['type','text','subject','url','mime_type','file_name'],'test_input');
  if(v.rule.version!==1||v.template.version!==1||v.rule.templateRef.version!==1||v.rule.position!==0||v.rule.enabled!==true||v.rule.executionMode!=='CONFIRM'||v.rule.grant!==null)throw Error('unsafe_generation_defaults');
  if(v.rule.action.type!=='shareact.core.model.Action.Webhook'||v.rule.action.connectionId!==context.bot_id)throw Error('bot_scope_mismatch');
  if(v.rule.templateRef.id!==v.template.id)throw Error('template_reference_mismatch');
  if(v.template.outputPreferences.language!==context.language||v.template.outputPreferences.format!=='markdown')throw Error('output_preferences_mismatch');
  return {ok:true,value:v};
 }catch(e){return {ok:false,error:e.message};}
}
export function runOracle(requests){
 const result=spawnSync('java',['-jar',path.join(skillRoot,'lib/validator.jar')],{input:requests.map(r=>JSON.stringify(r)).join('\n')+'\n',encoding:'utf8',maxBuffer:8*1024*1024,timeout:60000});
 if(result.error||result.status!==0)throw Error('oracle_unavailable_or_failed');
 const lines=result.stdout.trim().split('\n');if(lines.length!==requests.length)throw Error('oracle_response_count_mismatch');return lines.map(s=>JSON.parse(s));
}
export function validate(text,context,options={}){
 const m=gate(context,options),first=preflight(text,context);
 if(!first.ok)return {ok:false,stage:'strict_generation_policy',...first};
 const oracle=runOracle([{raw:text,context}])[0];
 return {ok:oracle.dry_run_passed===true,contract_id:m.contract_id,configuration_sha256:hash(Buffer.from(text)),context_sha256:hash(JSON.stringify(context)),oracle,live_service_readiness_checked:false,limitations:['Offline structural checks are not OAuth, quota, destination or device acceptance checks.','Case-insensitive matching uses ICU4J; Unicode behavior may differ from a particular Android ICU version.']};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const args=process.argv.slice(2),get=k=>args[args.indexOf(k)+1];
  if(!args[0]||!args.includes('--context'))throw Error('usage: validate.mjs FILE --context CONTEXT.json [--source ANDROID_SOURCE]');
  const bytes=fs.readFileSync(args[0]);if(bytes.length>1024*1024)throw Error('file_too_large');
  const text=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(bytes),context=parseStrict(fs.readFileSync(get('--context'),'utf8'));
  const report=validate(text,context,{source:sourceRoot(args.includes('--source')?get('--source'):null)});
  console.log(JSON.stringify(report,null,2));if(!report.ok)process.exitCode=1;
 }catch(e){fail(e.message);}
}
