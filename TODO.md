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
