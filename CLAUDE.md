# Claude Code Memory

## User preferences (always follow)

### 1. Send the updated HTML rendered at the end of every chat

After finishing the work in any session, send the repo's HTML file(s) that were created or
modified (e.g. `CDR.html`) to the user with the file-sending tool using inline rendering
(`display: "render"`), so the user sees the final rendered page without opening the file
manually. If a session touches no HTML file, send the repo's main HTML page rendered anyway
so the user always ends the chat seeing the current state of the app.

### 2. Keep the live artifact page up to date

This repo has one permanent artifact URL that the user keeps open in a browser tab. Whenever
an HTML file in this repo changes, republish that artifact so refreshing the tab shows the
latest version.

| Page | Artifact URL |
| --- | --- |
| `CDR.html` — Cervical Disc Replacement Radiographic Study | https://claude.ai/code/artifact/8fea71a8-e0d2-4ce9-84f2-5df509f209f4 |

How to republish (the URL must not change):

1. Copy the HTML to the scratchpad and strip the outer wrapper — the artifact host supplies
   its own `<!doctype html>`, `<html>`, `<head>`, `<body>`. Remove exactly those tags and
   their closing counterparts; keep everything else (`<meta>`, `<title>`, `<style>`,
   markup, `<script>`) verbatim.
2. Call the `Artifact` tool with that stripped file and `url:` set to the URL above. Passing
   `url` is what updates the existing page instead of minting a new one.
3. Keep `favicon: "🦴"` stable — the user finds the tab by its icon.

Note: cloud sync in this app posts to a Google Apps Script endpoint. The artifact host blocks
requests to external hosts, so cloud sync won't connect on the artifact page — local entry,
localStorage, charts, and export preview all work. Use the GitHub Pages copy below or a local
file when testing cloud sync.

### 3. Commit and push after every HTML edit

Don't leave edits stranded in the session container. Commit and push to the working branch as
soon as a change is complete, so the file on GitHub matches what the user just saw.

## GitHub Pages

`.github/workflows/pages.yml` publishes every `.html` in the repo root to GitHub Pages on each
push to `main`, and serves `CDR.html` as the landing page. The public page is
https://surajsajeev1988.github.io/CDR/ and it updates only when a pull request is merged to
`main` — work in progress lives on the artifact URL above.
