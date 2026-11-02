import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {cases,context} from './corpus.mjs';
import {preflight,runOracle} from '../skills/share-act-config/scripts/validate.mjs';
import {checkSource,gate,manifestPath} from '../skills/share-act-config/scripts/contract.mjs';
import {skillRoot,projectRoot,sourceRoot,readJson,writeJson,hash,implementationHash,evidenceHash} from '../skills/share-act-config/scripts/common.mjs';
const manifest=readJson(manifestPath),source=sourceRoot();
const bound={...context,contract_id:manifest.contract_id};
const requests=cases.map(c=>({raw:c.raw??JSON.stringify(c.value),context:bound}));
for(const file of fs.readdirSync(path.join(skillRoot,'examples')).filter(n=>n.endsWith('.json')&&!n.includes('context'))){
 cases.push({name:'template-'+file,raw:fs.readFileSync(path.join(skillRoot,'examples',file),'utf8'),preflight:true,codec:true,dry:true});
 requests.push({raw:cases.at(-1).raw,context:bound});
}
try{
 assert.equal(checkSource(source).ok,true,'Source contract drift');
 gate(bound,{allowStaged:true,source});
 const description=runOracle([{describe:true}])[0];
 assert.deepEqual(description.sample_files,manifest.sample_files,"Sample catalog differs from the actual App catalog");
 const outputs=runOracle(requests);
 const results=cases.map((c,i)=>{
  const strict=preflight(requests[i].raw,bound);const actual=outputs[i];
  assert.equal(strict.ok,c.preflight,c.name+': strict policy');
  assert.equal(actual.codec_accepted,c.codec,c.name+': Android codec');
  if(actual.codec_accepted){const caller=JSON.parse(requests[i].raw);assert.equal(actual.normalized.template.instruction,caller.template.instruction,c.name+': preserve opaque instruction');assert.equal(actual.normalized.template.outputPreferences.format,caller.template.outputPreferences.format,c.name+': preserve caller output format');}
  if(c.dry!==undefined)assert.equal(actual.dry_run_passed,c.dry,c.name+': supplementary dry run');
  const combined=strict.ok&&actual.dry_run_passed;
  assert.equal(combined,c.preflight&&c.codec&&c.dry!==false,c.name+': delivery gate');
  return {name:c.name,strict_policy:strict.ok,android_codec:actual.codec_accepted,dry_run:actual.dry_run_passed,delivery_gate:combined,error:strict.error??actual.error};
 });
 const report={ok:true,oracle_description:description,evidence_hash:evidenceHash(),contract_id:manifest.contract_id,implementation_hash:implementationHash(),jar_sha256:hash(fs.readFileSync(path.join(skillRoot,'lib/validator.jar'))),source_check:checkSource(source),case_count:results.length,results,scope:'Unmodified App envelope decoder plus core validation, unmodified task-neutral App protocol catalog, core request building, and supplementary ICU4J sample matching/rendering. No Android instrumentation or live account writes.'};
 writeJson(path.join(projectRoot,'reports/consistency.json'),report);console.log(JSON.stringify({ok:true,case_count:results.length,contract_id:manifest.contract_id}));
}catch(e){writeJson(path.join(projectRoot,'reports/consistency.json'),{ok:false,contract_id:manifest.contract_id,error:e.message});console.error(e);process.exitCode=1;}
