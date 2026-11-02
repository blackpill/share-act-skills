import {createHash} from 'node:crypto';
import {hash} from './common.mjs';

/** Passive, offline viewer: user-supplied JSON is base64 data, never executable markup. */
export function createCopyPage(bytes,expectedHash){
 if(hash(bytes)!==expectedHash)throw Error('copy_page_hash_mismatch');
 const code=`const encoded = '${bytes.toString('base64')}';
const expected = '${expectedHash}';
const view = document.getElementById('json');
const button = document.getElementById('copy');
const status = document.getElementById('status');
async function setup() {
 try {
  const bytes = Uint8Array.from(atob(encoded), c => c.charCodeAt(0));
  const rawText = new TextDecoder('utf-8', {fatal:true,ignoreBOM:true}).decode(bytes);
  view.textContent = rawText;
  const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), b => b.toString(16).padStart(2,'0')).join('');
  if (digest !== expected) throw new Error('File integrity check failed.');
  button.disabled = false;
  status.textContent = 'Checked bytes loaded. Copying does not reformat the JSON.';
  button.addEventListener('click', async () => {
   try {
    await navigator.clipboard.writeText(rawText);
    status.textContent = 'Config JSON copied. Paste as plain text, or import the original JSON file.';
   } catch (_) {
    status.textContent = 'Clipboard access is unavailable. Select the JSON below and copy it manually, or import the original JSON file.';
   }
  });
 } catch (_) {
  button.disabled = true;
  status.textContent = 'Unable to verify the embedded file here. Use the original validated JSON attachment.';
 }
}
setup();`;
 const cspHash=createHash('sha256').update(code).digest('base64');
 return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'sha256-${cspHash}'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">
<title>Copy validated config JSON</title><style>
:root{color-scheme:light;font-family:ui-sans-serif,system-ui,sans-serif;color:#14212e;background:#f5f7f9}*{box-sizing:border-box}body{margin:0;padding:28px 18px}main{max-width:960px;margin:auto}header{display:flex;gap:20px;align-items:center;justify-content:space-between;flex-wrap:wrap}h1{font-size:24px;line-height:1.2;letter-spacing:-.03em;margin:0 0 6px}p{line-height:1.5;margin:0;color:#455565}button{min-height:48px;padding:12px 20px;border:0;border-radius:10px;background:#173e62;color:white;font:inherit;font-weight:650;cursor:pointer}button:disabled{opacity:.45;cursor:wait}button:focus-visible{outline:3px solid #2b88d9;outline-offset:4px}#status{min-height:48px;padding:18px 0 10px}pre{margin:0;padding:20px;overflow:auto;white-space:pre-wrap;overflow-wrap:anywhere;background:white;border:1px solid #d7e0e7;border-radius:12px;font:14px/1.65 ui-monospace,SFMono-Regular,Consolas,monospace;tab-size:2}footer{font-size:12px;margin-top:14px;color:#526373;overflow-wrap:anywhere}
</style></head><body><main><header><div><h1>Validated config JSON</h1><p>Exact file content. No chat formatting.</p></div><button id="copy" type="button" disabled>Copy config JSON</button></header>
<p id="status" role="status" aria-live="polite">Verifying embedded bytes...</p><pre id="json" tabindex="0" aria-label="Configuration JSON"></pre><footer>SHA-256: ${expectedHash}<br>Contains your configuration. Keep this file private. No data is sent over the network.</footer></main><script>${code}</script></body></html>\n`;
}
