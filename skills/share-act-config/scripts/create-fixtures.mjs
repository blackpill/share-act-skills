import fs from 'node:fs';
import path from 'node:path';
import {skillRoot,readJson,writeJson} from './common.mjs';
const manifest=readJson(path.join(skillRoot,'contracts/current.json'));
const context={contract_id:manifest.contract_id,bot_id:'selected-bot-fixture',language:'en'};
const directory=path.join(skillRoot,'examples');
// This directory is generated protocol fixtures, never a location for user configurations.
for(const name of fs.readdirSync(directory).filter(n=>n.endsWith('.json')))fs.rmSync(path.join(directory,name));
for(const type of ['TEXT','LINK','FILE']){
 const id='generic-'+type.toLowerCase(),file=manifest.sample_files[0];
 const sample={type,text:'Protocol sample',subject:'',url:type==='LINK'?'https://example.com/input':null,mime_type:type==='FILE'?file.mime_type:'text/plain',file_name:type==='FILE'?file.file_name:null};
 const value={envelope_version:1,rule:{id,version:1,position:0,name:'Generic protocol fixture',groups:[[{type:'shareact.core.model.Condition.Type',value:type}]],templateRef:{id:id+'-template',version:1},action:{type:'shareact.core.model.Action.Webhook',connectionId:context.bot_id},enabled:true,executionMode:'CONFIRM',grant:null},template:{id:id+'-template',version:1,instruction:'{{text}}',outputPreferences:{language:'en',format:'markdown'}},test_input:sample};
 writeJson(path.join(directory,id+'.json'),value);
}
writeJson(path.join(directory,'context.fixture.json'),context);
console.log('Created three task-neutral protocol fixtures.');
