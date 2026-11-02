import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {cases,context} from './corpus.mjs';
import {finalizeConfig} from '../skills/share-act-config/scripts/finalize.mjs';
import {skillRoot,projectRoot,readJson,writeJson,hash,implementationHash,evidenceHash,sourceRoot} from '../skills/share-act-config/scripts/common.mjs';
const m=readJson(path.join(skillRoot,'contracts/current.json')),ctx={...context,contract_id:m.contract_id};
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'shareact-real-delivery-')),results=[];
try{
 const options={validationOptions:{allowStaged:true,source:sourceRoot()}};
 for(const name of fs.readdirSync(path.join(skillRoot,'examples')).filter(n=>n.endsWith('.json')&&!n.includes('context'))){
  const input=path.join(skillRoot,'examples',name),output=path.join(dir,name);
  const receipt=finalizeConfig(input,ctx,output,options);
  assert.deepEqual(fs.readFileSync(output),fs.readFileSync(input));
  assert.equal(receipt.configuration_sha256,hash(fs.readFileSync(output)));
  assert.equal(receipt.validation.oracle.codec_accepted,true);assert.equal(receipt.validation.oracle.request_builds,true);
  results.push({name,delivered:true,sha256:receipt.configuration_sha256});
 }
 for(const c of cases.filter(c=>!c.preflight||!c.codec||c.dry===false)){
  const input=path.join(dir,'draft-'+c.name+'.json'),output=path.join(dir,'blocked-'+c.name+'.json');fs.writeFileSync(input,c.raw??JSON.stringify(c.value));
  assert.throws(()=>finalizeConfig(input,ctx,output,options));
  assert.equal(fs.existsSync(output),false);assert.equal(fs.existsSync(output+'.validation.json'),false);
  results.push({name:c.name,delivered:false});
 }
 const report={ok:true,contract_id:m.contract_id,implementation_hash:implementationHash(),evidence_hash:evidenceHash(),jar_sha256:hash(fs.readFileSync(path.join(skillRoot,'lib/validator.jar'))),case_count:results.length,results,live_service_readiness_checked:false};
 writeJson(path.join(projectRoot,'reports/delivery.json'),report);console.log(JSON.stringify({ok:true,case_count:results.length}));
}catch(e){writeJson(path.join(projectRoot,'reports/delivery.json'),{ok:false,error:e.message});console.error(e);process.exitCode=1;}finally{fs.rmSync(dir,{recursive:true,force:true});}
