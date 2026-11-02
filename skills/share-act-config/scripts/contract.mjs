import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {skillRoot,projectRoot,hash,readJson,writeJson,walk,sourceRoot,implementationHash,evidenceHash,fail} from './common.mjs';
export const manifestPath=path.join(skillRoot,'contracts/current.json');
const appFiles=[
 'app/src/main/java/shareact/android/ui/rules/RuleWizardEnvelope.kt',
 'app/src/main/java/shareact/android/ui/rules/RuleConfigurationDiagnostics.kt',
 'app/src/main/java/shareact/android/ui/rules/RuleWizardTestFileCatalog.kt',
 'app/src/main/java/shareact/android/ui/rules/RuleWizardPrompt.kt',
 'app/src/main/java/shareact/android/ui/rules/RuleTestViewModel.kt',
 'app/src/main/java/shareact/android/ui/rules/RulesWorkspace.kt',
 'app/src/main/java/shareact/android/rules/BotActionPolicy.kt',
 'app/src/main/java/shareact/android/rules/AndroidTextCaseFolder.kt',
 'app/src/main/java/shareact/android/data/RuleRepository.kt',
 'app/src/main/res/values-en/grok-setup.xml',
 'app/build.gradle.kts','core/build.gradle.kts','gradle/libs.versions.toml'
];
export function fingerprint(source){
 const core=path.join(source,'core/src/main/kotlin');
 const names=[...walk(core).filter(p=>!p.endsWith("/ConfigurationPrompt.kt")).map(p=>path.relative(source,p)),...appFiles].sort();
 return Object.fromEntries(names.map(n=>[n.split(path.sep).join('/'),hash(fs.readFileSync(path.join(source,n)))]));
}
export function checkSource(source,manifest=readJson(manifestPath)){
 if(!source) throw Error('android_source_required');
 const now=fingerprint(source);
 const changed=[...new Set([...Object.keys(now),...Object.keys(manifest.source_hashes)])].filter(n=>now[n]!==manifest.source_hashes[n]);
 return {ok:changed.length===0,contract_id:manifest.contract_id,changed};
}
export function validationIdentity(hashes){
 // Generation wording is audited, but cannot be part of an identity embedded in that wording.
 const wording=new Set(['app/src/main/java/shareact/android/ui/rules/RuleWizardPrompt.kt','app/src/main/res/values-en/grok-setup.xml']);
 return hash(JSON.stringify(Object.fromEntries(Object.entries(hashes).filter(([name])=>!wording.has(name)))));
}
export function sync(source){
 if(!source)throw Error('android_source_required');
 const hashes=fingerprint(source);
 const get=n=>fs.readFileSync(path.join(source,n),'utf8');
 const codec=get(appFiles[0]);
 if(!/envelope\.envelopeVersion == 1/.test(codec))throw Error('unsupported_envelope_version_requires_manual_review');
 const sampleSource=get('app/src/main/java/shareact/android/ui/rules/RuleWizardTestFileCatalog.kt');
 if(!codec.includes('RuleWizardTestFileCatalog.find'))throw Error('sample_lookup_changed_requires_manual_review');
 const samples=[...sampleSource.matchAll(/RuleWizardTestFile\("([^"\n]+)",\s*"([^"\n]+)"\)/g)].map(m=>({file_name:m[1],mime_type:m[2]}));
 const unique=[...new Map(samples.map(s=>[s.file_name,s])).values()];
 if(unique.length<1)throw Error('sample_catalog_extraction_failed');
 const gradle=get('app/build.gradle.kts'), versions=get('gradle/libs.versions.toml');
 const manifest={manifest_version:1,contract_id:validationIdentity(hashes),source_snapshot_id:hash(JSON.stringify(hashes)),envelope_version:1,configuration_schema_version:2,app:{application_id:gradle.match(/applicationId = "([^"]+)"/)?.[1],version_name:gradle.match(/versionName = "([^"]+)"/)?.[1],version_code:Number(gradle.match(/versionCode = (\d+)/)?.[1])},toolchain:{kotlin:versions.match(/^kotlin = "([^"]+)"/m)?.[1],serialization:versions.match(/^serialization = "([^"]+)"/m)?.[1],jsoup:versions.match(/^jsoup = "([^"]+)"/m)?.[1],icu4j:'77.1'},sample_files:unique,source_hashes:hashes};
 if(Object.values(manifest.toolchain).some(v=>!v)||!manifest.app.application_id||!manifest.app.version_name)throw Error('contract_metadata_extraction_failed');
 writeJson(manifestPath,manifest);
 writeJson(path.join(projectRoot,'.local.json'),{android_source:path.resolve(source)});
 for(const p of ['contracts/approved.json','lib/oracle-build.json'])fs.rmSync(path.join(skillRoot,p),{force:true});
 return {ok:true,status:'staged_not_approved',contract_id:manifest.contract_id};
}
export function gate(context,{allowStaged=false,source}={}){
 const m=readJson(manifestPath);
 if(context.contract_id!==m.contract_id)throw Error('contract_id_mismatch');
 if(source){const r=checkSource(source,m);if(!r.ok)throw Error('source_contract_drift:'+r.changed.join(','));}
 const build=readJson(path.join(skillRoot,'lib/oracle-build.json'));
 if(build.contract_id!==m.contract_id||build.implementation_hash!==implementationHash()||build.jar_sha256!==hash(fs.readFileSync(path.join(skillRoot,'lib/validator.jar'))))throw Error('oracle_build_stale_or_tampered');
 if(!allowStaged){const approvedPath=path.join(skillRoot,'contracts/approved.json');if(!fs.existsSync(approvedPath))throw Error('contract_not_approved');const approved=readJson(approvedPath);if(approved.contract_id!==m.contract_id||approved.implementation_hash!==implementationHash()||approved.jar_sha256!==build.jar_sha256)throw Error('contract_not_approved');}
 return m;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try {
  const command=process.argv[2];const i=process.argv.indexOf('--source');const source=sourceRoot(i<0?null:process.argv[i+1]);
  if(command==='sync')console.log(JSON.stringify(sync(source),null,2));
  else if(command==='check'){const r=checkSource(source);console.log(JSON.stringify(r,null,2));if(!r.ok)process.exitCode=1;}
  else if(command==='approve'){
   const report=readJson(path.join(projectRoot,'reports/consistency.json'));
   const m=readJson(manifestPath),build=readJson(path.join(skillRoot,'lib/oracle-build.json'));
   const delivery=readJson(path.join(projectRoot,'reports/delivery.json'));
   if(!delivery.ok||delivery.contract_id!==m.contract_id||delivery.implementation_hash!==implementationHash()||delivery.evidence_hash!==evidenceHash()||delivery.jar_sha256!==build.jar_sha256)throw Error('passing_current_delivery_report_required');
   gate({contract_id:m.contract_id},{allowStaged:true,source});
   if(report.evidence_hash!==evidenceHash())throw Error('consistency_evidence_stale');
   if(!report.ok||report.contract_id!==m.contract_id||report.implementation_hash!==implementationHash()||report.jar_sha256!==build.jar_sha256)throw Error('passing_current_consistency_report_required');
   writeJson(path.join(skillRoot,'contracts/approved.json'),{contract_id:m.contract_id,implementation_hash:implementationHash(),evidence_hash:evidenceHash(),jar_sha256:build.jar_sha256,delivery_report_sha256:hash(fs.readFileSync(path.join(projectRoot,'reports/delivery.json'))),consistency_report_sha256:hash(fs.readFileSync(path.join(projectRoot,'reports/consistency.json')))});
   console.log(JSON.stringify({ok:true,status:'approved',contract_id:m.contract_id}));
  }else throw Error('usage: contract.mjs sync|check|approve --source PATH');
 }catch(e){fail(e.message);}
}
