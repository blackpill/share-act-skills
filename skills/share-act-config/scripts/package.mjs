import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {skillRoot,projectRoot,readJson,writeJson,walk,hash,implementationHash,evidenceHash,sourceRoot,fail} from './common.mjs';
import {gate,manifestPath} from './contract.mjs';
try{
 const m=readJson(manifestPath);gate({contract_id:m.contract_id},{source:sourceRoot()});
 const approval=readJson(path.join(skillRoot,'contracts/approved.json'));
 if(approval.evidence_hash!==evidenceHash())throw Error('tests_or_examples_changed_since_approval');
 const deliveryPath=path.join(projectRoot,'reports/delivery.json');
 if(hash(fs.readFileSync(deliveryPath))!==approval.delivery_report_sha256)throw Error('delivery_report_changed_since_approval');
 const reportPath=path.join(projectRoot,'reports/consistency.json');
 if(hash(fs.readFileSync(reportPath))!==approval.consistency_report_sha256)throw Error('consistency_report_changed_since_approval');
 const tests=spawnSync(process.execPath,['--test',...walk(path.join(projectRoot,'tests')).filter(p=>p.endsWith('.test.mjs'))],{cwd:projectRoot,encoding:'utf8',maxBuffer:4*1024*1024});
 if(tests.status!==0)throw Error('current_regression_tests_failed:'+tests.stdout+tests.stderr);
 const staging=path.join(projectRoot,'.cache/package'),dest=path.join(staging,'share-act-config');fs.rmSync(staging,{recursive:true,force:true});fs.mkdirSync(dest,{recursive:true});
 for(const file of walk(skillRoot)){
  const rel=path.relative(skillRoot,file);
  if(rel.startsWith('oracle/build/')||rel.startsWith('oracle/.gradle/'))continue;
  if(!/\.(?:md|json|mjs|kt|kts|jar)$/.test(file))continue;
  const target=path.join(dest,rel);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(file,target);
 }
 fs.copyFileSync(reportPath,path.join(dest,'references/validation-report.json'));
 fs.copyFileSync(deliveryPath,path.join(dest,'references/delivery-report.json'));
 for(const file of walk(dest).filter(p=>!p.endsWith('.jar'))){if(/[\u3400-\u9fff\uf900-\ufaff]/u.test(fs.readFileSync(file,'utf8')))throw Error('non_english_CJK_text_in_package:'+path.relative(dest,file));}
 const out=path.join(projectRoot,'dist/share-act-config.zip');fs.mkdirSync(path.dirname(out),{recursive:true});fs.rmSync(out,{force:true});
 const zip=spawnSync('zip',['-qr',out,'share-act-config'],{cwd:staging,encoding:'utf8'});if(zip.status!==0)throw Error('archive_creation_failed');
 writeJson(path.join(projectRoot,'dist/manifest.json'),{archive:'share-act-config.zip',sha256:hash(fs.readFileSync(out)),contract_id:m.contract_id,implementation_hash:implementationHash(),file_count:walk(dest).length,english_text_check:true,regression_tests:'passed'});
 console.log(JSON.stringify({ok:true,archive:out,bytes:fs.statSync(out).size},null,2));
}catch(e){fail(e.message);}
