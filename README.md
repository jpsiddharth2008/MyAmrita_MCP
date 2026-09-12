# Amrita AI Assistant

A personal MCP server that lets an AI assistant (Claude, ChatGPT, etc.) read data from the
Amrita Vishwa Vidyapeetham student portal (`students.amrita.edu`) on your behalf — attendance,
timetable, marks, and more — using your own logged-in session.

Built on [NitroStack](https://nitrostack.ai) (`typescript-starter` template).

## What This Includes

- `auth` module — captures and persists a Microsoft SSO-backed portal session
- `attendance` module — `attendance_get_attendance`, `attendance_get_low_attendance_subjects`
- More modules tracked as issues on this repo, built one at a time

## Setup

```bash
npm install
cp .env.example .env
```

Generate a real value for `SESSION_ENCRYPTION_KEY` in `.env`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Logging In

The portal's login is federated through Microsoft Entra ID (Microsoft SSO) — there's no
username/password form to automate directly, and the MCP client host (e.g. NitroStudio)
often can't display a browser window itself. So logging in is a two-step, semi-manual process:

**1. Launch a debuggable browser yourself, in your own terminal:**

```
"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --remote-debugging-port=9222 --user-data-dir="%TEMP%\amrita-edge-profile"
```

Leave that Edge window open.

**2. Call the `auth_login` tool** (from NitroStudio, or any MCP client connected to this
server). It connects to that already-open browser, navigates it to the Amrita SSO login page,
and waits (up to 5 minutes) for you to sign in yourself — including any MFA step. Once you land
back on the portal dashboard, the resulting session is captured and persisted (encrypted, to
`.amrita-session.enc`) so every other tool reuses it automatically until the portal session
itself expires. Re-run `auth_login` (with the Edge window open again) whenever `auth_status`
reports `authenticated: false`.

`auth_logout` clears the locally stored session.

## Common Commands

```bash
npm run dev     # start in development mode (STDIO transport)
npm run build   # compile TypeScript + bundle widgets
npm start       # build and run the production server
```

## Testing with NitroStudio

[NitroStudio](https://nitrostack.ai/studio) is the recommended way to inspect and manually
test tools during development: open it, point it at this project folder, and use the Tools
page to execute tools, inspect input schemas, and view JSON output.

## Manual auth test script

`scripts/manual-auth-test.mjs` connects to the built server directly over stdio with a
generous per-call timeout, useful for testing `auth_login` end-to-end outside of NitroStudio:

```bash
npm run build
node scripts/manual-auth-test.mjs
```

## Links

- NitroStack docs: <https://docs.nitrostack.ai>
- Issue tracker (feature build-out): <https://github.com/jpsiddharth2008/MyAmrita_MCP/issues>
