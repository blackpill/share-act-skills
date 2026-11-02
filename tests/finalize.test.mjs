import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {finalizeConfig} from '../skills/share-act-config/scripts/finalize.mjs';
import {envelope,context} from './corpus.mjs';
import {hash} from '../skills/share-act-config/scripts/common.mjs';

function fixture(fn){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'shareact-finalize-'));try{return fn(dir);}finally{fs.rmSync(dir,{recursive:true,force:true});}}
const accepted=(raw,ctx)=>({ok:true,configuration_sha256:hash(raw),context_sha256:hash(JSON.stringify(ctx)),oracle:{codec_accepted:true,dry_run_passed:true}});
test('finalization emits only the exact checked bytes and a separate receipt',()=>fixture(dir=>{
 const input=path.join(dir,'draft.json'),output=path.join(dir,'config.json');const bytes=Buffer.from(JSON.stringify(envelope(),null,2)+'\n');fs.writeFileSync(input,bytes);
 const receipt=finalizeConfig(input,context,output,{validator:accepted});
 assert.deepEqual(fs.readFileSync(output),bytes);
 assert.equal(receipt.configuration_sha256,hash(bytes));assert.equal(receipt.validation.ok,true);
 assert.equal(JSON.parse(fs.readFileSync(output+'.validation.json')).configuration_sha256,hash(bytes));
}));
test('a failed validator never creates a deliverable or receipt',()=>fixture(dir=>{
 const input=path.join(dir,'draft.json'),output=path.join(dir,'config.json');fs.writeFileSync(input,'{}');
 assert.throws(()=>finalizeConfig(input,context,output,{validator:()=>({ok:false,error:'invalid_json'})}),/configuration_not_validated/);
 assert.equal(fs.existsSync(output),false);assert.equal(fs.existsSync(output+'.validation.json'),false);
}));
test('malformed UTF-8 and mismatched validation evidence are rejected',()=>fixture(dir=>{
 const input=path.join(dir,'draft.json'),output=path.join(dir,'config.json');fs.writeFileSync(input,Buffer.from([0xff]));
 assert.throws(()=>finalizeConfig(input,context,output,{validator:accepted}));
 fs.writeFileSync(input,JSON.stringify(envelope()));
 assert.throws(()=>finalizeConfig(input,context,output,{validator:()=>({ok:true,configuration_sha256:'wrong',context_sha256:'wrong'})}),/validation_evidence_mismatch/);
 assert.equal(fs.existsSync(output),false);
}));
test('existing output or receipt is never overwritten',()=>fixture(dir=>{
 const input=path.join(dir,'draft.json'),output=path.join(dir,'config.json');fs.writeFileSync(input,JSON.stringify(envelope()));fs.writeFileSync(output,'original');
 assert.throws(()=>finalizeConfig(input,context,output,{validator:accepted}),/output_already_exists/);assert.equal(fs.readFileSync(output,'utf8'),'original');
 fs.rmSync(output);fs.writeFileSync(output+'.validation.json','original receipt');
 assert.throws(()=>finalizeConfig(input,context,output,{validator:accepted}),/output_already_exists/);assert.equal(fs.existsSync(output),false);
}));
test('Markdown links and literal newlines cannot be finalized as valid JSON',()=>fixture(dir=>{
 const input=path.join(dir,'draft.json'),output=path.join(dir,'config.json');
 for(const raw of ['{"instruction":"first\nsecond"}',JSON.stringify(envelope())+'](https://example.com)']){
  fs.writeFileSync(input,raw);assert.throws(()=>finalizeConfig(input,context,output,{validator:()=>({ok:false,error:'json_syntax'})}),/configuration_not_validated/);assert.equal(fs.existsSync(output),false);
 }
}));
test('output mutation during the final validation cannot produce a success receipt',()=>fixture(dir=>{
 const input=path.join(dir,'draft.json'),output=path.join(dir,'config.json');fs.writeFileSync(input,JSON.stringify(envelope()));let calls=0;
 const mutate=(raw,ctx)=>{calls++;if(calls===2)fs.writeFileSync(output,'corrupted after read');return accepted(raw,ctx);};
 assert.throws(()=>finalizeConfig(input,context,output,{validator:mutate}),/final_file_changed/);
 assert.equal(fs.existsSync(output),false);assert.equal(fs.existsSync(output+'.validation.json'),false);
}));
test('replacement of the output inode is rejected even if the bytes match',()=>fixture(dir=>{
 const input=path.join(dir,'draft.json'),output=path.join(dir,'config.json');fs.writeFileSync(input,JSON.stringify(envelope()));let calls=0;
 const replace=(raw,ctx)=>{calls++;if(calls===2){const replacement=path.join(dir,'replacement.json');fs.writeFileSync(replacement,raw);fs.renameSync(replacement,output);}return accepted(raw,ctx);};
 assert.throws(()=>finalizeConfig(input,context,output,{validator:replace}),/final_file_changed/);
 assert.equal(fs.existsSync(output),false);
}));
test('a finalized file includes a copy helper bound to the same bytes',()=>fixture(dir=>{
 const input=path.join(dir,'draft.json'),output=path.join(dir,'config.json');const bytes=Buffer.from(JSON.stringify(envelope()));fs.writeFileSync(input,bytes);
 const receipt=finalizeConfig(input,context,output,{validator:accepted});
 const helper=fs.readFileSync(output+'.copy.html');assert.equal(receipt.copy_helper_sha256,hash(helper));assert.ok(helper.toString().includes(bytes.toString('base64')));
}));
test('helper cleanup failure cannot leave a success receipt or JSON deliverable',()=>fixture(dir=>{
 const input=path.join(dir,'draft.json'),output=path.join(dir,'config.json');fs.writeFileSync(input,JSON.stringify(envelope()));
 const originalOpen=fs.openSync;
 try{
  fs.openSync=function(file,...args){
   if(file===output+'.validation.json') {fs.rmSync(output+'.copy.html');fs.mkdirSync(output+'.copy.html');}
   return originalOpen.call(fs,file,...args);
  };
  assert.throws(()=>finalizeConfig(input,context,output,{validator:accepted}));
 }finally{fs.openSync=originalOpen;}
 assert.equal(fs.existsSync(output),false);assert.equal(fs.existsSync(output+'.validation.json'),false);
 assert.equal(fs.statSync(output+'.copy.html').isDirectory(),true);
}));
