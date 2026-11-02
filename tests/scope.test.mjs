import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {skillRoot,walk} from '../skills/share-act-config/scripts/common.mjs';

test('published guidance and examples are compliance-only, without business playbooks',()=>{
 const files=[path.join(skillRoot,'SKILL.md'),...walk(path.join(skillRoot,'references')).filter(p=>p.endsWith('.md')&&!p.endsWith('third-party-licenses.md')),...walk(path.join(skillRoot,'examples')).filter(p=>p.endsWith('.json'))];
 for(const file of files){const text=fs.readFileSync(file,'utf8');assert.doesNotMatch(text,/Notion|Spotify|Amazon|calori|transcript|spreadsheet_id|calendar_id|folder_id|authorized_folder_scope/i,file);}
 assert.equal(fs.existsSync(path.join(skillRoot,'references/services.md')),false);
 assert.equal(fs.existsSync(path.join(skillRoot,'references/runtime.md')),false);
});
test('the skill treats instruction content as opaque rather than defining business behavior',()=>{
 const text=fs.readFileSync(path.join(skillRoot,'SKILL.md'),'utf8');
 assert.ok(text.includes('Treat template.instruction as opaque caller-provided content'));
 assert.ok(text.includes('Do not connect services, choose destinations or execute the configuration'));
});
