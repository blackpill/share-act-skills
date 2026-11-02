import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createCopyPage} from '../skills/share-act-config/scripts/copy-page.mjs';
import {hash} from '../skills/share-act-config/scripts/common.mjs';

test('copy page embeds exact checked bytes rather than reserializing JSON',()=>{
 const bytes=Buffer.from('{"instruction":"\\\"quoted\\\"\\nvalue <script>alert(1)</script>"}\n');
 const html=createCopyPage(bytes,hash(bytes));
 assert.ok(html.includes(bytes.toString('base64')));
 assert.ok(html.includes('Copy config JSON'));
 assert.ok(html.includes('navigator.clipboard.writeText(rawText)'));
 assert.ok(html.includes('textContent = rawText'));
 assert.ok(!html.includes('<script>alert(1)</script>'));
 assert.ok(html.includes('crypto.subtle.digest'));
 assert.ok(html.includes('aria-live="polite"'));
});

test('the real button copies decoded raw text and reports clipboard failure honestly',async()=>{
 const {runInNewContext}=await import('node:vm');const {webcrypto}=await import('node:crypto');
 const text='{"text":"literal \\n and \\"quote\\" <b>value</b>"}\n',bytes=Buffer.from(text),html=createCopyPage(bytes,hash(bytes));
 const script=html.match(/<script>([\s\S]*)<\/script>/)[1];
 const elements={json:{},copy:{disabled:true,addEventListener:(name,fn)=>{elements.copy.click=fn;}},status:{}};const copied=[];
 const sandbox={document:{getElementById:id=>elements[id]},crypto:webcrypto,TextDecoder,Uint8Array,atob:s=>Buffer.from(s,'base64').toString('binary'),navigator:{clipboard:{writeText:async value=>{copied.push(value);}}}};
 await runInNewContext(script,sandbox);
 assert.equal(elements.copy.disabled,false);assert.equal(elements.json.textContent,text);
 await elements.copy.click();assert.deepEqual(copied,[text]);assert.match(elements.status.textContent,/copied/);
 sandbox.navigator.clipboard.writeText=async()=>{throw Error('denied');};await elements.copy.click();assert.match(elements.status.textContent,/unavailable/);
});
