---
description: Security-scan, then publish this project to a GitHub repo with README, GitHub Pages, CI/CD workflow, and repo About section
argument-hint: <github-repo-url>
allowed-tools: Bash, Read, Write, Edit, Grep, Glob, AskUserQuestion, mcp__playwright__*
---

Publish this project to GitHub. The repo link is: `$ARGUMENTS`

If `$ARGUMENTS` is empty, ask the user for the repo link (e.g. `https://github.com/<owner>/<repo>`) before doing anything. Parse `<owner>` and `<repo>` from it (strip a trailing `.git`).

Work through the steps in order. Do the security scan FIRST, because nothing may be pushed until it passes. Respect the project's constraints in `CLAUDE.md` (vanilla HTML/CSS/JS, no build tooling, no persistence, no real branding). Report each step's outcome briefly as you go.

## 0. Preflight

- Run `git status`, `git remote -v`, `git branch --show-current`.
- Check `gh` availability (`command -v gh`) and auth (`gh auth status`). If `gh` is missing or unauthenticated, tell the user how to fix it (`brew install gh && gh auth login`) and stop at the first step that needs it. Do not ask the user to paste tokens into chat, and never write tokens to files.
- Never use `--force` push, and never rewrite history, without explicit user approval.

## 1. Security scan (blocking)

Scan every tracked and untracked, non-ignored file, plus git history (`git log -p --all`), for sensitive data:

- Secrets: API keys, tokens, passwords, private keys (`-----BEGIN .* PRIVATE KEY-----`), `AKIA...`, `ghp_`/`github_pat_`, `sk-`, `xox[bp]-`, Bearer tokens, connection strings, `.env` files, `*.pem`, `*.key`, `id_rsa`.
- Personal data: real email addresses, phone numbers, local absolute paths such as `/Users/<name>`. In particular check `FORMSUBMIT_ENDPOINT` in `index.html`: a real personal email address or FormSubmit hash must not be committed unless the user explicitly confirms it is intended to be public. The placeholder is fine.
- Files that should not be uploaded: `.DS_Store`, `node_modules`, `.claude/settings.local.json`, editor/OS junk, large binaries.

Use Grep/Bash (`grep -rEn`), and run `gitleaks detect` or `trufflehog` too if installed (do not install them without asking).

Then:
- Create or update `.gitignore` to cover `.DS_Store`, `.env*`, `*.pem`, `*.key`, `node_modules/`, `.claude/settings.local.json`.
- Report findings in a table (file, line, type, severity). Never print a full secret value; mask it.
- If anything sensitive is found: STOP, show the findings, and ask the user how to proceed (remove, replace with placeholder, or confirm it is intentionally public). If it exists in git history, tell the user it needs history rewriting and get explicit approval first. Do not continue to the push until the scan is clean or the user explicitly accepts each finding.

## 2. README

Create or update `README.md` (preserve any accurate existing content; do not overwrite blindly):

- Title and one-line description (IT PMO Kanban board demo for a fictitious bank).
- Live demo link: `https://<owner>.github.io/<repo>/`
- CI badge: `![CI](https://github.com/<owner>/<repo>/actions/workflows/ci.yml/badge.svg)`
- Features, how to run locally (open `index.html`, no build or server), tech constraints (vanilla, no persistence, FormSubmit email notification and its placeholder/activation note), project structure, and a disclaimer that it is a demo with no real branding.
- Derive facts from `index.html` and `CLAUDE.md`; do not invent features.
- Screenshot: capture the running site with the Playwright MCP tools (`mcp__playwright__*`) and embed it under the title.
  1. Playwright MCP blocks the `file:` protocol, so serve the project folder locally and navigate to it: run `python3 -m http.server 8765 --bind 127.0.0.1` from the project root (in the background; if the port is already in use, a server is already running, which is fine), then open `http://127.0.0.1:8765/index.html`. Resize the viewport to about 1440x900 first. Stop the server when done.
  2. Wait for the board to render, then use `browser_take_screenshot` (full page, PNG) and save it as `docs/screenshot.png`. Make sure no toast, open dialog, or other transient UI is in the shot.
  3. Embed it in the README: `![IT PMO Kanban board](docs/screenshot.png)` (relative path, so it renders on GitHub).
  4. If the Playwright MCP server is unavailable (e.g. `npx`/Node.js missing), tell the user how to fix it and ask whether to skip the screenshot; do not substitute another tool silently.
  5. Add `.playwright-mcp/` to `.gitignore` (Playwright MCP writes snapshots and console logs there) and do not commit it. Add `docs/screenshot.png` to the commit in step 4 and to the project structure list. The screenshot is a documentation asset only; it is not part of the site, so the CI/CD job still uploads just `index.html`.

## 3. CI/CD GitHub Action

Create or update `.github/workflows/ci.yml`. It must:

- Trigger on push and pull_request to the default branch, plus `workflow_dispatch`.
- CI job: checkout; validate that `index.html` exists, is non-empty, and has no inline `<script src=` / `<link href=` to external CDNs (enforces the no-CDN rule); optionally run an HTML check (e.g. `npx --yes html-validate index.html` or `tidy`) as non-blocking if noisy; run a secret scan (e.g. `gitleaks/gitleaks-action`) .
- CD job (push to default branch only, after CI passes): deploy to GitHub Pages using `actions/configure-pages`, `actions/upload-pages-artifact`, `actions/deploy-pages`, with `permissions: contents: read, pages: write, id-token: write` and a `pages` concurrency group. Upload only the files needed for the site (copy `index.html` into a `_site/` dir) so `.git`, `.claude`, and `CLAUDE.md` are not published.
- Use least-privilege `permissions` and pin actions to current major versions.

## 4. Commit and push

- Show `git status` and the list of files to be committed; confirm nothing flagged in step 1 is included.
- Stage specific files (not `git add -A` blindly), commit with a clear message (include the Co-Authored-By attribution line from the session's instructions), and set `origin` to the provided repo URL if it differs (`git remote set-url origin ...` or `git remote add origin ...`).
- Push the current branch: `git push -u origin <branch>`. Before pushing, tell the user exactly which repo and branch will receive the code and get a clear yes. If the push is rejected as non-fast-forward, stop and ask; do not force.

## 5. GitHub Pages

- Enable Pages with GitHub Actions as the source (if not already): `gh api -X POST repos/<owner>/<repo>/pages -f build_type=workflow` (if it already exists, use `-X PUT`). Pages on private repos require a paid plan; if it fails for that reason, report it.
- Wait for the workflow run (`gh run list` / `gh run watch`) and confirm the deployment; get the URL with `gh api repos/<owner>/<repo>/pages --jq .html_url`.
- Verify the site responds (`curl -sI <url>` returns 200). If it fails, show the logs (`gh run view --log-failed`) and fix the cause.

## 6. Repo About section

Update the repo's About with the Pages URL as the website:

```bash
gh repo edit <owner>/<repo> \
  --description "IT PMO Kanban board demo for a fictitious bank. Vanilla HTML/CSS/JS, single file." \
  --homepage "https://<owner>.github.io/<repo>/" \
  --add-topic kanban --add-topic vanilla-js --add-topic html --add-topic github-pages --add-topic demo
```

Adjust the description to match the README. Confirm with `gh repo view <owner>/<repo> --json description,homepageUrl,repositoryTopics`.

## 7. Final report

Summarize in a short list: security scan result, files committed, repo URL, Pages URL, CI workflow status, and About section values. Flag anything the user must do manually (e.g. activating the FormSubmit endpoint, enabling Pages in repo settings, installing/authenticating `gh`).
