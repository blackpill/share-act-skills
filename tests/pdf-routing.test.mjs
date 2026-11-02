import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {skillRoot} from '../skills/share-act-config/scripts/common.mjs';

test('PDF playbook chooses per-document folders and asks rather than guessing',()=>{
 const text=fs.readFileSync(path.join(skillRoot,'references/services.md'),'utf8').split('## PDFs to Google Drive')[1].split('## Podcast')[0];
 for(const phrase of ['filename and actual PDF content','each PDF','multiple plausible folders','ask the user before filing','not a fixed destination','do not reuse the last chosen folder'])assert.ok(text.includes(phrase),phrase);
 assert.ok(text.includes('Do not create folders'));
});
test('PDF fixture persists routing scope rather than a fixed leaf folder',()=>{
 const v=JSON.parse(fs.readFileSync(path.join(skillRoot,'examples/pdf-drive.json'),'utf8'));
 const text=v.template.instruction;
 assert.ok(text.includes('filename and actual PDF content'));
 assert.ok(text.includes('authorized_folder_scope'));
 assert.ok(text.includes('ask the user before filing'));
 assert.ok(!text.includes('file it under verified folder_id='));
 assert.equal(v.test_input.file_name,'Quarterly-report.pdf');
});
