import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validate,parseStrict} from './validate.mjs';
import {hash,sourceRoot,fail} from './common.mjs';

/** The CLI has no validation bypass. Injection is an explicit unit-test seam only. */
export function finalizeConfig(input,context,output,{validator=validate,validationOptions={}}={}){
 const receiptPath=output+'.validation.json';
 if(fs.existsSync(output)||fs.existsSync(receiptPath))throw Error('output_already_exists');
 const bytes=fs.readFileSync(input);if(bytes.length>1048576)throw Error('file_too_large');
 const decode=b=>new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(b);
 const checked=text=>{
  const result=validator(text,context,validationOptions);
  if(result.ok!==true)throw Error('configuration_not_validated:'+JSON.stringify({stage:result.stage,error:result.error,oracle_error:result.oracle?.error}));
  if(result.configuration_sha256!==hash(Buffer.from(text))||result.context_sha256!==hash(JSON.stringify(context)))throw Error('validation_evidence_mismatch');
  return result;
 };
 checked(decode(bytes));
 let created=false,receiptCreated=false;
 let outputIdentity;
 const ensureUnchanged=()=>{const stat=fs.lstatSync(output);if(!stat.isFile()||stat.dev!==outputIdentity.dev||stat.ino!==outputIdentity.ino||!fs.readFileSync(output).equals(bytes))throw Error('final_file_changed');};
 try{
  const outputFd=fs.openSync(output,'wx',0o600);created=true;try{fs.writeFileSync(outputFd,bytes);fs.fsyncSync(outputFd);outputIdentity=fs.fstatSync(outputFd);}finally{fs.closeSync(outputFd);}
  const finalBytes=fs.readFileSync(output);if(!finalBytes.equals(bytes))throw Error('final_file_changed');
  const result=checked(decode(finalBytes));
  ensureUnchanged();
  const receipt={delivery_format:'json_file_attachment',configuration_sha256:hash(finalBytes),context_sha256:result.context_sha256,contract_id:result.contract_id,validation:{ok:true,oracle:{codec_accepted:result.oracle?.codec_accepted,dry_run_passed:result.oracle?.dry_run_passed,request_builds:result.oracle?.request_builds},live_service_readiness_checked:false}};
  const receiptFd=fs.openSync(receiptPath,'wx',0o600);receiptCreated=true;try{fs.writeFileSync(receiptFd,JSON.stringify(receipt,null,2)+'\n');}finally{fs.closeSync(receiptFd);}
  ensureUnchanged();
  return receipt;
 }catch(e){if(receiptCreated)fs.rmSync(receiptPath,{force:true});if(created)fs.rmSync(output,{force:true});throw e;}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const args=process.argv.slice(2),get=k=>args[args.indexOf(k)+1];
  if(!args[0]||!args.includes('--context')||!args.includes('--out'))throw Error('usage: finalize.mjs INPUT.json --context CONTEXT.json --out FINAL.json [--source ANDROID_SOURCE]');
  const context=parseStrict(fs.readFileSync(get('--context'),'utf8'));
  const receipt=finalizeConfig(args[0],context,get('--out'),{validationOptions:{source:sourceRoot(args.includes('--source')?get('--source'):null)}});
  console.log(JSON.stringify({ok:true,configuration_file:path.resolve(get('--out')),receipt_file:path.resolve(get('--out')+'.validation.json'),...receipt},null,2));
 }catch(e){fail(e.message);}
}
