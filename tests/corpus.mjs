export const botId = 'selected-bot-fixture';
export const context = {bot_id: botId, language: 'en'};
export function envelope(kind='FILE') {
  const sample = kind==='FILE'
    ? {type:'FILE',text:'Food photo',subject:'',url:null,mime_type:'image/jpeg',file_name:'Studio-photo.jpg'}
    : kind==='LINK'
    ? {type:'LINK',text:'Podcast episode',subject:'',url:'https://open.spotify.com/episode/1TlNXfKkC732xX1AuCMeXp',mime_type:'text/plain',file_name:null}
    : {type:'TEXT',text:'Meet on 2026-11-03 at 10:00 UTC',subject:'',url:null,mime_type:'text/plain',file_name:null};
  return {envelope_version:1,rule:{id:'example-rule',version:1,position:0,name:'Fixture rule',groups:[[{type:'shareact.core.model.Condition.Type',value:kind}]],templateRef:{id:'example-template',version:1},action:{type:'shareact.core.model.Action.Webhook',connectionId:botId},enabled:true,executionMode:'CONFIRM',grant:null},template:{id:'example-template',version:1,instruction:'Process {{text}} and report uncertainty. Do not write without a verified destination.',outputPreferences:{language:'en',format:'markdown'}},test_input:sample};
}
const modify = fn => {const v=envelope();fn(v);return v;};
const escapedRequest=envelope('TEXT');escapedRequest.test_input.text='"'.repeat(65536);escapedRequest.template.instruction='{{text}}';
const multiline=envelope('LINK');multiline.template.instruction='First line\nRead {{url}}';
export const cases=[
  {name:"utf8-bom-is-not-stripped",raw:"\ufeff"+JSON.stringify(envelope()),preflight:false,codec:false,dry:false},
  {name:'escaped-newline-valid',value:multiline,preflight:true,codec:true,dry:true},
  {name:'literal-newline-instruction',raw:JSON.stringify(multiline).replace('First line\\nRead','First line\nRead'),preflight:false,codec:false,dry:false},
  {name:'markdown-link-corrupts-tail',raw:JSON.stringify(envelope('LINK'))+'](https://open.spotify.com/episode/test)',preflight:false,codec:false,dry:false},
  {name:'markdown-link-in-url',value:(()=>{const v=envelope('LINK');v.test_input.url='[episode](https://open.spotify.com/episode/test)';return v;})(),preflight:true,codec:false,dry:false},
  {name:"request-escaping-exceeds-wire-limit",value:escapedRequest,preflight:true,codec:true,dry:false},
  ...['FILE','LINK','TEXT'].map(k=>({name:`valid-${k}`,value:envelope(k),preflight:true,codec:true,dry:true})),
  {name:'wrong-bot',value:modify(v=>v.rule.action.connectionId='another-bot'),preflight:false,codec:false},
  {name:'future-version',value:modify(v=>v.envelope_version=2),preflight:false,codec:false},
  {name:'extra-top-field',value:modify(v=>v.connections=[]),preflight:false,codec:false},
  {name:'reference-mismatch',value:modify(v=>v.rule.templateRef.id='wrong'),preflight:false,codec:false},
  {name:'unknown-sample',value:modify(v=>v.test_input.file_name='fries.jpg'),preflight:true,codec:false},
  {name:'mime-extension-mismatch',value:modify(v=>v.test_input.mime_type='application/pdf'),preflight:true,codec:false},
  {name:'sample-does-not-match',value:modify(v=>v.rule.groups=[[{type:'shareact.core.model.Condition.Type',value:'TEXT'}]]),preflight:true,codec:true,dry:false},
  {name:'unknown-variable',value:modify(v=>v.template.instruction='Read {{secret}}'),preflight:true,codec:false},
  {name:'missing-variable-on-file',value:modify(v=>v.template.instruction='Read {{url}}'),preflight:true,codec:true,dry:false},
  {name:'oversized-template',value:modify(v=>v.template.instruction='x'.repeat(8193)),preflight:true,codec:false},
  {name:'empty-groups',value:modify(v=>v.rule.groups=[]),preflight:true,codec:false},
  {name:'too-many-conditions',value:modify(v=>v.rule.groups[0]=Array(6).fill(v.rule.groups[0][0])),preflight:true,codec:false},
  {name:'non-webhook',value:modify(v=>v.rule.action={type:'shareact.core.model.Action.CopyText'}),preflight:false,codec:false},
  {name:'bad-domain',value:modify(v=>v.rule.groups[0].push({type:'shareact.core.model.Condition.Domain',value:'https://example.com'})),preflight:true,codec:false},
  {name:'bad-path',value:modify(v=>v.rule.groups[0].push({type:'shareact.core.model.Condition.PathPrefix',value:'/x?q=1'})),preflight:true,codec:false},
  {name:'grant-import',value:modify(v=>v.rule.grant={ruleVersion:1,templateVersion:1,connectionVersion:1,orderVersion:1}),preflight:false,codec:false},
  {name:'non-canonical-safety',value:modify(v=>v.rule.executionMode='AUTOMATIC'),preflight:false,codec:true,dry:true},
  {name:'disabled-normalized-by-app',value:modify(v=>v.rule.enabled=false),preflight:false,codec:true,dry:true},
  {name:'missing-default-fields',value:modify(v=>delete v.test_input.subject),preflight:false,codec:true,dry:true},
  {name:'malformed-json',raw:'{"envelope_version":',preflight:false,codec:false},
  {name:'markdown-fence',raw:'```json\n{}\n```',preflight:false,codec:false},
  {name:'duplicate-root-key',raw:JSON.stringify(envelope()).replace('"envelope_version":1','"envelope_version":1,"envelope_version":1'),preflight:false,codec:false,dry:false},
  {name:'wrong-language-normalized-by-app',value:modify(v=>v.template.outputPreferences.language='zh-CN'),preflight:false,codec:true,dry:true},
  {name:'surrogate',value:modify(v=>v.template.instruction='\ud800'),preflight:false,codec:false},
];
