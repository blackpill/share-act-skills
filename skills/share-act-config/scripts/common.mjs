import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
export const skillRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const projectRoot=path.resolve(skillRoot,'../..');
export const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
export const readJson=p=>JSON.parse(fs.readFileSync(p,'utf8'));
export function writeJson(p,v){fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');}
export function walk(root){return fs.readdirSync(root,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(root,e.name)):[path.join(root,e.name)]).sort();}
export function sourceRoot(explicit){return explicit||process.env.SHAREACT_ANDROID_SOURCE||(fs.existsSync(path.join(projectRoot,'.local.json'))?readJson(path.join(projectRoot,'.local.json')).android_source:null);}
export function implementationHash(){const files=[...walk(path.join(skillRoot,'scripts')).filter(p=>p.endsWith('.mjs')),...walk(path.join(skillRoot,'oracle')).filter(p=>!p.includes('/build/')&&!p.includes('/.gradle/')&&(/\.kt$|\.kts$/.test(p)))];return hash(JSON.stringify(files.map(p=>[path.relative(skillRoot,p),hash(fs.readFileSync(p))])));}
export function fail(error,details){console.error(JSON.stringify({ok:false,error,details}));process.exitCode=1;}

export function evidenceHash(){const files=[...walk(path.join(projectRoot,'tests')),...walk(path.join(skillRoot,'examples')),...['package.json','package-lock.json'].map(n=>path.join(projectRoot,n)).filter(p=>fs.existsSync(p))];return hash(JSON.stringify(files.map(p=>[path.relative(projectRoot,p),hash(fs.readFileSync(p))])));}
