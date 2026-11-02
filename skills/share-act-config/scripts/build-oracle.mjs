import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {skillRoot,sourceRoot,readJson,writeJson,hash,implementationHash,fail} from './common.mjs';
import {checkSource,manifestPath} from './contract.mjs';
try {
 const i=process.argv.indexOf('--source'),source=sourceRoot(i<0?null:process.argv[i+1]);
 if(!source||!checkSource(source).ok)throw Error('source_required_and_must_match_staged_contract');
 const m=readJson(manifestPath),t=m.toolchain;
 const args=['-p',path.join(skillRoot,'oracle'),'--console=plain','jar',`-PandroidSource=${source}`,`-PkotlinVersion=${t.kotlin}`,`-PserializationVersion=${t.serialization}`,`-PjsoupVersion=${t.jsoup}`,`-PicuVersion=${t.icu4j}`];
 const r=spawnSync(path.join(source,'gradlew'),args,{cwd:path.join(skillRoot,'oracle'),stdio:'inherit'});
 if(r.error||r.status!==0)throw Error('oracle_build_failed');
 const dest=path.join(skillRoot,'lib/validator.jar');fs.copyFileSync(path.join(skillRoot,'oracle/build/libs/validator.jar'),dest);
 writeJson(path.join(skillRoot,'lib/oracle-build.json'),{contract_id:m.contract_id,implementation_hash:implementationHash(),jar_sha256:hash(fs.readFileSync(dest)),codec:'Unmodified Android RuleWizardEnvelopeCodec',sample_adapter:'Unmodified task-neutral App protocol catalog; no resource or business-template classes',case_folding:`ICU4J ${t.icu4j}; Android ICU version may differ`});
 console.log(JSON.stringify({ok:true,jar:dest}));
}catch(e){fail(e.message);}
