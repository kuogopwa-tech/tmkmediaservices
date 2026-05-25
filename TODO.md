# TODO - Make Continue button in upload clickable

- [x] Add modal layering/pointer-events CSS fix in `public/index.html`
- [x] Mark task complete after edit
- [x] Sanity-check JS wiring remains unchanged

## Follow-up fix (Continue still not clickable)
- [x] Harden Continue binding in `public/main.js` (`addEventListener`, force button type)
- [x] Ensure password action row has explicit z-index/clickability in `public/index.html`
- [ ] Re-verify upload modal control behavior

## New task: Harden push script to push everything reliably
- [x] Update `push.bat` with robust branch/upstream handling
- [x] Keep stage-all behavior while excluding `.env`
- [x] Remove fragile pause flow and improve error handling/messages
- [ ] Validate script execution path in PowerShell (`.\push.bat`)

## New task: Make Continue button functional + password validation + friendly errors
- [x] Harden Continue button flow in `public/main.js` (disable while authenticating, better error messages)
- [x] Strengthen frontend password validation and user-friendly feedback in `public/main.js`
- [x] Add robust server-side validation/error handling in `api/change-password.js`
- [x] Align auth endpoint messaging/error handling in `api/auth.js`
- [x] Sanity-check updated flows and mark completion

## New task: Enforce Blackbox-only chat provider config
- [x] Remove all legacy AI_PROVIDER/AI_* compatibility logic from `api/chat.js`
- [x] Validate required `BLACKBOX_*` variables with clean JSON errors
- [x] Keep retry + fallback + non-hanging error response behavior
- [ ] Re-test `/api/chat` method guard, payload guard, and success path

## New task: Production-grade AI provider 429 retry + fallback handling
- [x] Add explicit 429 detection + Retry-After parsing in `api/chat.js`
- [x] Retry primary model once after provider delay, then fallback models
- [x] Add detailed provider attempt logging in `api/chat.js`
- [x] Keep chat UI responsive and show busy/retrying message in `public/main.js`
- [ ] Re-test `/api/chat` method/payload/normal flow and capture behavior

## New task: Switch chat provider to Blackbox paid API
- [ ] Update `api/chat.js` env resolution to prioritize `BLACKBOX_*` vars
- [ ] Keep retry + fallback behavior intact with Blackbox model chain
- [ ] Improve config error text to include Blackbox env names
- [ ] Re-test `/api/chat` (GET/invalid POST/normal POST) after restart
