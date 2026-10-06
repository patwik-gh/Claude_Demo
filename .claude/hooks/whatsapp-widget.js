#!/usr/bin/env node
// Hook: injects a floating WhatsApp chat widget into v2/index.html.
// Clicking the icon opens a dialog of suggested IT-project queries; picking one
// opens WhatsApp (wa.me) to WA_NUMBER with the query pre-filled.
// Idempotent: re-running replaces the block between the markers.
// v1 (root index.html) is intentionally left untouched.
//
// Usage: node .claude/hooks/whatsapp-widget.js

const fs = require('fs');
const path = require('path');

const TARGET = path.join(__dirname, '..', '..', 'v2', 'index.html');
const START = '<!-- whatsapp-widget:start -->';
const END = '<!-- whatsapp-widget:end -->';
const WA_NUMBER = '6512345678';

const QUERIES = [
  'What is the status of my IT project?',
  'Which IT projects are overdue?',
  'How do I raise a new IT project request?',
  'Who is the project manager for my project?',
  'Can I get the details of the next IT Project Briefing?',
];

const BLOCK = `${START}
<style>
.wa-fab {
  position: fixed; right: var(--space-4, 16px); bottom: var(--space-4, 16px); z-index: 70;
  width: 56px; height: 56px; border: 0; border-radius: 50%;
  background: #25d366; color: #fff; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 16px rgba(0,0,0,.24);
}
.wa-fab:hover { background: #1ebe5b; }
.wa-fab:focus-visible, .wa-query:focus-visible, .wa-close:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
.wa-fab svg { width: 30px; height: 30px; fill: currentColor; }
.wa-dialog {
  position: fixed; right: var(--space-4, 16px); bottom: 84px; z-index: 70;
  width: min(340px, calc(100vw - 32px));
  background: var(--surface); color: var(--ink);
  border: 1px solid var(--line); border-radius: var(--r-lg);
  box-shadow: 0 8px 32px rgba(0,0,0,.18); font-family: var(--font); overflow: hidden;
}
.wa-dialog[hidden] { display: none; }
.wa-head { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; background: #075e54; color: #fff; }
.wa-head h2 { margin: 0; font-size: 15px; }
.wa-close { border: 0; background: transparent; color: #fff; font-size: 22px; line-height: 1; cursor: pointer; padding: 2px 8px; border-radius: var(--r-sm); }
.wa-body { padding: 14px 16px 16px; }
.wa-body p { margin: 0 0 10px; font-size: 14px; color: var(--ink-soft); }
.wa-query {
  display: block; width: 100%; box-sizing: border-box; margin: 0 0 8px; padding: 10px 12px;
  text-align: left; font: inherit; font-size: 14px; color: var(--ink); text-decoration: none;
  background: var(--accent-tint); border: 1px solid var(--line-soft); border-radius: var(--r-md); cursor: pointer;
}
.wa-query:hover { border-color: var(--accent); }
</style>
<div class="wa-dialog" id="waDialog" role="dialog" aria-labelledby="waTitle" hidden>
  <div class="wa-head">
    <h2 id="waTitle">IT PMO Assistant</h2>
    <button type="button" class="wa-close" id="waClose" aria-label="Close chat">&times;</button>
  </div>
  <div class="wa-body">
    <p>Hi! Pick a question to continue on WhatsApp:</p>
${QUERIES.map((q) => `    <a class="wa-query" href="https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(q)}" target="_blank" rel="noopener noreferrer">${q}</a>`).join('\n')}
  </div>
</div>
<button type="button" class="wa-fab" id="waFab" aria-label="Chat on WhatsApp" aria-expanded="false" aria-controls="waDialog">
  <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16.04 3C9.4 3 4 8.4 4 15.04c0 2.12.55 4.18 1.6 6L4 28l7.1-1.86a12 12 0 0 0 4.94 1.06C22.68 27.2 28 21.8 28 15.16 28 8.4 22.68 3 16.04 3Zm0 21.96a9.9 9.9 0 0 1-5.06-1.38l-.36-.22-4.2 1.1 1.12-4.1-.24-.38a9.9 9.9 0 0 1-1.52-5.3c0-5.48 4.46-9.94 9.96-9.94 5.48 0 9.92 4.46 9.92 9.94 0 5.5-4.44 9.28-9.62 9.28Zm5.46-7.44c-.3-.14-1.78-.88-2.06-.98-.28-.1-.48-.14-.68.14-.2.3-.78.98-.96 1.18-.18.2-.36.22-.66.08a8.1 8.1 0 0 1-2.4-1.48 9 9 0 0 1-1.66-2.06c-.18-.3-.02-.46.14-.6.14-.14.3-.36.46-.54.14-.18.2-.3.3-.5.1-.2.04-.38-.02-.52-.08-.14-.68-1.64-.92-2.24-.24-.58-.5-.5-.68-.5h-.58c-.2 0-.52.08-.8.38-.28.3-1.06 1.04-1.06 2.54s1.08 2.94 1.24 3.14c.14.2 2.14 3.26 5.18 4.56.72.32 1.28.5 1.72.64.72.22 1.38.2 1.9.12.58-.08 1.78-.72 2.02-1.42.26-.7.26-1.3.18-1.42-.08-.14-.28-.22-.58-.36Z"/></svg>
</button>
<script>
(function () {
  var fab = document.getElementById('waFab');
  var dialog = document.getElementById('waDialog');
  var closeBtn = document.getElementById('waClose');
  function setOpen(open) {
    dialog.hidden = !open;
    fab.setAttribute('aria-expanded', String(open));
    if (open) { dialog.querySelector('.wa-query').focus(); } else { fab.focus(); }
  }
  fab.addEventListener('click', function () { setOpen(dialog.hidden); });
  closeBtn.addEventListener('click', function () { setOpen(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !dialog.hidden) setOpen(false); });
})();
</script>
${END}
`;

let html = fs.readFileSync(TARGET, 'utf8');
const re = new RegExp(START + '[\\s\\S]*?' + END + '\\n?');
if (re.test(html)) {
  html = html.replace(re, () => BLOCK);
} else {
  html = html.replace('</body>', () => BLOCK + '</body>');
}
fs.writeFileSync(TARGET, html);
console.log('WhatsApp widget written to v2/index.html');
