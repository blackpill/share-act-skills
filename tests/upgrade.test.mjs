import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {checkSource,fingerprint,gate,manifestPath} from '../skills/share-act-config/scripts/contract.mjs';
import {readJson,sourceRoot} from '../skills/share-act-config/scripts/common.mjs';

test('every tracked source byte change fails the source gate',()=>{
 const source=sourceRoot(),m=readJson(manifestPath);assert.equal(checkSource(source,m).ok,true);
 const altered=structuredClone(m);const key=Object.keys(altered.source_hashes)[0];altered.source_hashes[key]='changed';
 assert.deepEqual(checkSource(source,altered).changed,[key]);
});
test('removed and newly tracked files are reported without modifying Android',()=>{
 const source=sourceRoot(),m=readJson(manifestPath),altered=structuredClone(m);
 delete altered.source_hashes['app/build.gradle.kts'];altered.source_hashes['removed.kt']='old';
 const changes=checkSource(source,altered).changed;
 assert.ok(changes.includes('app/build.gradle.kts'));assert.ok(changes.includes('removed.kt'));
});
test('unknown contract identity fails closed before validation',()=>{
 assert.throws(()=>gate({contract_id:'unknown-future-contract'},{allowStaged:true}),/contract_id_mismatch/);
});
test('changing any copied source is detected against the current source lock',()=>{
 const source=sourceRoot(),m=readJson(manifestPath),temp=fs.mkdtempSync(path.join(os.tmpdir(),'shareact-contract-'));
 try{
  for(const file of Object.keys(m.source_hashes)){const dest=path.join(temp,file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(source,file),dest);}
  assert.equal(checkSource(temp,m).ok,true);
  const target=path.join(temp,'app/src/main/java/shareact/android/ui/rules/RuleWizardEnvelope.kt');fs.appendFileSync(target,'\n// Simulated contract upgrade.\n');
  assert.equal(checkSource(temp,m).ok,false);
  fs.writeFileSync(path.join(temp,'core/src/main/kotlin/NewContract.kt'),'// Newly introduced validator.\n');
  assert.ok(checkSource(temp,m).changed.includes('core/src/main/kotlin/NewContract.kt'));
 }finally{fs.rmSync(temp,{recursive:true,force:true});}
});

test('oracle metadata and approval tampering fail closed in an isolated skill copy',async()=>{
 const {skillRoot,implementationHash,hash,writeJson}=await import('../skills/share-act-config/scripts/common.mjs');
 const {pathToFileURL}=await import('node:url');
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'shareact-gate-'));
 try{
  for(const name of ['scripts','contracts','oracle/src'])fs.cpSync(path.join(skillRoot,name),path.join(temp,name),{recursive:true});
  for(const name of ['build.gradle.kts','settings.gradle.kts'])fs.copyFileSync(path.join(skillRoot,'oracle',name),path.join(temp,'oracle',name));
  fs.mkdirSync(path.join(temp,'lib'),{recursive:true});
  fs.copyFileSync(path.join(skillRoot,'lib/validator.jar'),path.join(temp,'lib/validator.jar'));
  const common=await import(pathToFileURL(path.join(temp,'scripts/common.mjs')));
  const contract=await import(pathToFileURL(path.join(temp,'scripts/contract.mjs')));
  const m=readJson(path.join(temp,'contracts/current.json'));
  const build={contract_id:m.contract_id,implementation_hash:common.implementationHash(),jar_sha256:common.hash(fs.readFileSync(path.join(temp,'lib/validator.jar')))};
  writeJson(path.join(temp,'lib/oracle-build.json'),build);fs.rmSync(path.join(temp,'contracts/approved.json'),{force:true});
  assert.throws(()=>contract.gate({contract_id:m.contract_id}),/contract_not_approved/);
  writeJson(path.join(temp,'contracts/approved.json'),build);
  assert.equal(contract.gate({contract_id:m.contract_id}).contract_id,m.contract_id);
  fs.appendFileSync(path.join(temp,'lib/validator.jar'),'tampered');
  assert.throws(()=>contract.gate({contract_id:m.contract_id}),/oracle_build_stale_or_tampered/);
 }finally{fs.rmSync(temp,{recursive:true,force:true});}
});
