#!/usr/bin/env node
// Hook: injects the "IT Project Briefing" popup into v2/index.html.
// The popup appears after the visitor has stayed on the page for 10 seconds.
// Idempotent: re-running replaces the block between the markers.
// v1 (root index.html) is intentionally left untouched.
//
// Usage: node .claude/hooks/briefing-popup.js

const fs = require('fs');
const path = require('path');

const TARGET = path.join(__dirname, '..', '..', 'v2', 'index.html');
const START = '<!-- briefing-popup:start -->';
const END = '<!-- briefing-popup:end -->';

const BLOCK = `${START}
<style>
.briefing-popup {
  position: fixed; right: var(--space-4, 16px); bottom: 88px;
  z-index: 60; width: min(360px, calc(100vw - 32px));
  background: var(--surface); color: var(--ink);
  border: 1px solid var(--line); border-radius: var(--r-lg);
  box-shadow: 0 8px 32px rgba(0,0,0,.16); padding: 18px 20px;
  font-family: var(--font);
}
.briefing-popup[hidden] { display: none; }
.briefing-popup h2 { margin: 0 0 4px; font-size: 16px; }
.briefing-popup p { margin: 0 0 4px; font-size: 14px; color: var(--ink-soft); }
.briefing-popup .briefing-when { color: var(--ink); font-weight: 600; }
.briefing-popup button {
  margin-top: 12px; padding: 8px 16px; border: 0; border-radius: var(--r-sm);
  background: var(--accent); color: #fff; font: inherit; font-size: 14px; cursor: pointer;
}
.briefing-popup button:hover { background: var(--accent-hover); }
</style>
<div class="briefing-popup" id="briefingPopup" role="dialog" aria-labelledby="briefingTitle" hidden>
  <h2 id="briefingTitle">IT Project Briefing</h2>
  <p class="briefing-when">Next Wednesday, 14 Oct 2026 &middot; 2:00 PM</p>
  <p>Town Hall Meeting Room</p>
  <button type="button" id="briefingClose">Got it</button>
</div>
<script>
(function () {
  var popup = document.getElementById('briefingPopup');
  var closeBtn = document.getElementById('briefingClose');
  function close() { popup.hidden = true; }
  closeBtn.addEventListener('click', close);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  setTimeout(function () { popup.hidden = false; closeBtn.focus(); }, 10000);
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
console.log('Briefing popup written to v2/index.html');
