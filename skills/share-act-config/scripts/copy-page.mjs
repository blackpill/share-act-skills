import {hash} from './common.mjs';

/** Generate source for Grok Bot's native Page tool, never a standalone HTML viewer. */
export function createCopyPage(bytes,expectedHash){
 if(hash(bytes)!==expectedHash)throw Error('copy_page_hash_mismatch');
 const text=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(bytes);
 // Encode a string, not the configuration object. Its runtime value preserves the checked text.
 const literal=JSON.stringify(text).replaceAll('<','\\u003c').replaceAll('\u2028','\\u2028').replaceAll('\u2029','\\u2029');
 return `import { Page, Section, Text, Button, useState, useGrokTheme } from "grok/canvas";

const configText: string = ${literal};
const configSha256: string = "${expectedHash}";

async function copyText(text: string): Promise<boolean> {
  let textarea: HTMLTextAreaElement | undefined;
  let previousFocus: HTMLElement | null = null;
  try {
    previousFocus = document.activeElement as HTMLElement | null;
    textarea = document.createElement("textarea");
    textarea.value = text;
    // Browsers normalize CR/CRLF in textarea.value. Never report an altered copy as exact.
    if (textarea.value === text) {
      textarea.setAttribute("readonly", "");
      textarea.style.position = "absolute";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.focus({ preventScroll: true });
      textarea.select();
      textarea.setSelectionRange(0, text.length);
      if (document.execCommand("copy")) return true;
    }
  } catch (_) {
    // A real failure falls through to the asynchronous API.
  } finally {
    try { textarea?.remove(); } catch (_) {}
    try { previousFocus?.focus({ preventScroll: true }); } catch (_) {}
  }
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (_) {}
  return false;
}

export default function App() {
  const theme = useGrokTheme();
  const [copied, setCopied] = useState<boolean>(false);
  const [copying, setCopying] = useState<boolean>(false);
  const [failed, setFailed] = useState<boolean>(false);
  return (
    <Page title="Copy config JSON" summary="Copy the exact validated configuration to your clipboard." lang="en">
      <Section heading="Configuration">
        <Button
          label={copying ? "Copying..." : copied ? "Copied" : "Copy config JSON"}
          variant="primary"
          onClick={async () => {
            if (copying) return;
            setCopying(true);
            setCopied(false);
            setFailed(false);
            try {
              const ok = await copyText(configText);
              setCopied(ok);
              setFailed(!ok);
            } catch (_) {
              setFailed(true);
            } finally {
              setCopying(false);
            }
          }}
        />
        <div style={{ fontSize: "13px", lineHeight: "1.6", color: theme.text.primary, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", userSelect: "text", WebkitUserSelect: "text", whiteSpace: "pre-wrap", overflowWrap: "anywhere", padding: "12px 0" }}>{configText}</div>
      </Section>
      {failed ? (
        <Section heading="Clipboard access unavailable">
          <Text>Long-press the JSON above to select and copy it manually, or import the original JSON attachment. Copying was not reported as successful.</Text>
        </Section>
      ) : null}
      <Section heading="Checked file">
        <Text>{"SHA-256: " + configSha256}</Text>
        <Text>The button copies the original text, not a reformatted JSON object.</Text>
      </Section>
    </Page>
  );
}
`;
}
