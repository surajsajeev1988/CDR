# Claude Code Memory

## User preferences (always follow)

- **At the end of every chat, send the updated HTML rendered.** After finishing the work in any session, send the repo's HTML file(s) that were created or modified (e.g. `CDR.html`) to the user with the file-sending tool using inline rendering (`display: "render"`), so the user sees the final rendered page without opening the file manually. If a session touches no HTML file, send the repo's main HTML page rendered anyway so the user always ends the chat seeing the current state of the app.
