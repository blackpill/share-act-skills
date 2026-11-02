import path from 'node:path';
import {skillRoot,readJson,writeJson} from './common.mjs';
const context={contract_id:readJson(path.join(skillRoot,'contracts/current.json')).contract_id,bot_id:'selected-bot-fixture',language:'en'};
const condition=(type,value)=>({type:'shareact.core.model.Condition.'+type,value});
const definitions=[
 ['food-calories','FILE','Estimate food portions and calories with explicit uncertainty. Append-only to verified spreadsheet_id=fixture-spreadsheet, spreadsheet_url=https://docs.google.com/spreadsheets/d/fixture-spreadsheet/edit, sheet_id=0, sheet_name=Food log. Include source private_url and task_id. These destination identifiers are fixtures, not authorized live resources.'],
 ['pdf-drive','FILE','Use the existing files[].file_id and file it under verified folder_id=fixture-folder, folder_url=https://drive.google.com/drive/folders/fixture-folder. Never make the file public or upload a duplicate. These identifiers are test fixtures.'],
 ['podcast-notion','LINK','Read an available transcript for {{url}}, or transcribe legally accessible audio with an actual available tool. Never invent transcript content or bypass access controls. Save title, transcript and source URL to page_id=fixture-page, page_url=https://www.notion.so/fixture-page after authorization. This is a fixture, not a verified live destination.'],
 ['text-calendar','TEXT','Extract the title, date, time, time zone and location from {{text}}. Use calendar_id=fixture-calendar, time_zone=UTC, calendar_url=https://calendar.google.com/. Confirm ambiguity before creating an event. Deduplicate only with verified persistent state. This destination is a fixture.'],
 ['amazon-monitor','LINK','Inspect the product at {{url}}. Check that authorized recurring monitoring and notification tools exist. Use monitoring_id=fixture-monitor and notification_target=fixture-bot-conversation only after authorization. Confirm frequency, duration, region, currency and price/restock/coupon criteria. Do not purchase. These settings are fixtures and do not enable a real monitor.']
];
for(const [id,kind,instruction] of definitions){
 const pdf=id==='pdf-drive',podcast=id==='podcast-notion',amazon=id==='amazon-monitor';
 const sample=kind==='FILE'?{type:'FILE',text:pdf?'PDF report':'Food photo',subject:'',url:null,mime_type:pdf?'application/pdf':'image/jpeg',file_name:pdf?'Quarterly-report.pdf':'Studio-photo.jpg'}:kind==='LINK'?{type:'LINK',text:podcast?'Podcast episode access test':'Product access test',subject:'',url:podcast?'https://open.spotify.com/episode/1TlNXfKkC732xX1AuCMeXp':'https://www.amazon.com/dp/B000000000',mime_type:'text/plain',file_name:null}:{type:'TEXT',text:'Team meeting on 2026-11-03 at 10:00 UTC in London',subject:'',url:null,mime_type:'text/plain',file_name:null};
 const conditions=[condition('Type',kind)];
 if(kind==='FILE')conditions.push(condition('MimeType',sample.mime_type));
 if(podcast)conditions.push(condition('Domain','open.spotify.com'),condition('PathPrefix','/episode/'));
 if(amazon)conditions.push(condition('Domain','amazon.com'));
 if(amazon)conditions.at(-1).includeSubdomains=true;
 const v={envelope_version:1,rule:{id,version:1,position:0,name:id.split('-').join(' '),groups:[conditions],templateRef:{id:id+'-template',version:1},action:{type:'shareact.core.model.Action.Webhook',connectionId:context.bot_id},enabled:true,executionMode:'CONFIRM',grant:null},template:{id:id+'-template',version:1,instruction,outputPreferences:{language:'en',format:'markdown'}},test_input:sample};
 writeJson(path.join(skillRoot,'examples',id+'.json'),v);
}
writeJson(path.join(skillRoot,'examples/context.fixture.json'),context);
console.log('Created five offline fixture envelopes and their contract-bound context.');
