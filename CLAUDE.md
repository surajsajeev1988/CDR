# Project Instructions

## Rendered HTML after every response

At the end of EVERY chat response in this project, in addition to the normal
markdown reply, also deliver a rendered HTML version of the answer:

1. Write a self-contained, lightly styled HTML page containing the final
   answer/summary of the response (not the full transcript). Use inline CSS
   only — no external scripts, stylesheets, or fonts.
2. Save it to the session scratchpad/temp directory. Do NOT commit these
   HTML files to the repository.
3. Send it to the user so it renders inline:
   - If the `SendUserFile` tool is available (Claude Code web sessions),
     call it with `display: "render"`.
   - Otherwise, save it as `chat-render.html` in the repo root (it is
     gitignored) and tell the user the file path.

Keep the page small and fast to generate. This applies to every turn unless
the user explicitly says to skip it for that turn.
