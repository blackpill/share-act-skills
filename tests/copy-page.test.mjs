import {test} from 'node:test';
import assert from 'node:assert/strict';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import {createCopyPage} from '../skills/share-act-config/scripts/copy-page.mjs';
import {hash} from '../skills/share-act-config/scripts/common.mjs';

function loadPage(text,{exec=true,clipboard,normalizeTextarea=false}={}){
 const source=createCopyPage(Buffer.from(text),hash(Buffer.from(text)));
 const emitted=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX},reportDiagnostics:true});
 assert.deepEqual(emitted.diagnostics,[]);
 const writes=[],textareas=[],selection=[];let removed=0,execCalls=0;
 const makeTextarea=()=>{let value='';return {style:{},get value(){return value;},set value(text){value=normalizeTextarea?text.replace(/\r\n?/g,'\n'):text;},setAttribute(){},focus(){},select(){selection.push(this.value);},setSelectionRange(){},remove(){removed++;}};};
 const document={activeElement:{focus(){}},createElement:makeTextarea,body:{appendChild(ta){textareas.push(ta);}},execCommand(command){assert.equal(command,'copy');execCalls++;if(exec instanceof Error)throw exec;return exec;}};
 const states=[];let hookIndex=0;
 const canvas={Page:'native-Page',Section:'native-Section',Text:'native-Text',Button:'native-Button',useState:initial=>{const i=hookIndex++;if(!(i in states))states[i]=initial;return [states[i],v=>{states[i]=v;}];},useGrokTheme:()=>({text:{primary:'#111'},font:{family:'system-ui'}})};
 const runtime={jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})};
 const sandbox={exports:{},document,navigator:{clipboard:clipboard??{writeText:async value=>{writes.push(value);}}},require:name=>{if(name==='grok/canvas')return canvas;if(name==='react/jsx-runtime')return runtime;throw Error(name);}};
 runInNewContext(emitted.outputText+'\nglobalThis.copyForTest = copyText; globalThis.textForTest = configText;',sandbox);
 return {source,writes,textareas,selection,get removed(){return removed;},get execCalls(){return execCalls;},copy:sandbox.copyForTest,raw:sandbox.textForTest,states,render:()=>{hookIndex=0;return sandbox.exports.default();}};
}
function find(node,type){if(!node||typeof node!=='object')return null;if(node.type===type)return node;for(const c of [].concat(node.props?.children??[])){const found=find(c,type);if(found)return found;}return null;}

test('generated source uses native canvas components and preserves exact text',()=>{
 const text='{"value":"quoted \\"text\\"\\n<script>data</script>"}\n';const page=loadPage(text);
 for(const name of ['Page','Section','Text','Button','useState','useGrokTheme'])assert.ok(page.source.includes(name));
 assert.ok(page.source.includes('from "grok/canvas"'));
 assert.ok(!page.source.includes('<!doctype html>'));assert.ok(!page.source.includes('<script>data</script>'));assert.ok(!page.source.includes('crypto.subtle'));
 assert.equal(page.raw,text);assert.equal(page.render().type,'native-Page');
 assert.equal(find(page.render(),'native-Button').props.label,'Copy config JSON');
});
test('execCommand is attempted synchronously first and the textarea is always removed',async()=>{
 const page=loadPage('exact config\n');const pending=page.copy(page.raw);
 assert.equal(page.execCalls,1);assert.equal(page.removed,1);assert.equal(await pending,true);
 assert.deepEqual(page.selection,[page.raw]);assert.deepEqual(page.writes,[]);
});
test('async fallback is awaited and rejection never becomes success',async()=>{
 let resolve;const writes=[];
 const page=loadPage('exact text',{exec:false,clipboard:{writeText:text=>{writes.push(text);return new Promise(r=>{resolve=r;});}}});
 let completed=false;const pending=page.copy(page.raw).then(ok=>{completed=true;return ok;});
 await Promise.resolve();assert.equal(completed,false);assert.deepEqual(writes,[page.raw]);resolve();assert.equal(await pending,true);
 const denied=loadPage('exact',{exec:false,clipboard:{writeText:async()=>{throw Error('denied');}}});assert.equal(await denied.copy(denied.raw),false);assert.equal(denied.removed,1);
});
test('native Button updates success and failure states only from real copy results',async()=>{
 const success=loadPage('data');await find(success.render(),'native-Button').props.onClick();assert.equal(find(success.render(),'native-Button').props.label,'Copied');
 const failure=loadPage('data',{exec:new Error('blocked'),clipboard:{writeText:async()=>{throw Error('denied');}}});await find(failure.render(),'native-Button').props.onClick();
 assert.equal(find(failure.render(),'native-Button').props.label,'Copy config JSON');
 assert.equal(failure.states[2],true);assert.equal(failure.removed,1);
});

test('Page TSX type-checks against the API shape supplied by the user',async()=>{
 const fs=await import('node:fs'),os=await import('node:os'),path=await import('node:path');
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'shareact-page-types-'));
 try{
  const input=path.join(dir,'page.tsx'),shim=path.join(dir,'canvas.d.ts');
  fs.writeFileSync(input,createCopyPage(Buffer.from('{"value":"sample"}\n'),hash(Buffer.from('{"value":"sample"}\n'))));
  fs.writeFileSync(shim,`declare module "grok/canvas" {
    export function Page(props:{title:string;summary:string;lang:string;children?:any}):any;
    export function Section(props:{heading:string;children?:any}):any;
    export function Text(props:{children?:any}):any;
    export function Button(props:{label:string;variant:"primary";onClick:()=>void|Promise<void>}):any;
    export function useState<T>(value:T):[T,(value:T)=>void];
    export function useGrokTheme():{text:{primary:string};font:{family:string}};
  }
  declare module "react/jsx-runtime" {
    export namespace JSX { interface IntrinsicElements { [name:string]:any } interface ElementChildrenAttribute {children:{}} }
    export function jsx(type:any,props:any):any; export function jsxs(type:any,props:any):any;
  }`);
  const program=ts.createProgram([input,shim],{noEmit:true,strict:true,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,types:[],lib:['lib.es2022.d.ts','lib.dom.d.ts']});
  const errors=ts.getPreEmitDiagnostics(program).filter(d=>d.category===ts.DiagnosticCategory.Error);
  assert.deepEqual(errors.map(e=>ts.flattenDiagnosticMessageText(e.messageText,' ')),[]);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('textarea newline normalization cannot silently change copied text',async()=>{
 const text='{\r\n  "value": "sample"\r\n}\r\n';
 const page=loadPage(text,{normalizeTextarea:true});assert.equal(await page.copy(page.raw),true);
 assert.equal(page.execCalls,0);assert.deepEqual(page.writes,[text]);
 const denied=loadPage(text,{normalizeTextarea:true,clipboard:{writeText:async()=>{throw Error('denied');}}});
 assert.equal(await denied.copy(denied.raw),false);assert.equal(denied.execCalls,0);
});
