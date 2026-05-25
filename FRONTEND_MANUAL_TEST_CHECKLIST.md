# Frontend Full Manual Walkthrough Checklist

## Environment
- [ ] Open app at `http://localhost:5000`
- [ ] Open DevTools Console and verify no blocking JS errors on initial load
- [ ] Verify page loads fully (navbar, header, videos section, services, contact, footer)

---

## 1) Global Layout & Navigation

### Navbar
- [ ] Brand/logo visible
- [ ] `Home` link clickable
- [ ] `Our Services` link scrolls to services section
- [ ] `Contact` link scrolls to contact section
- [ ] `Upload` button opens upload modal
- [ ] On small viewport: navbar toggler opens/closes menu

### Header
- [ ] Hero title/subtitle/content visible
- [ ] YouTube CTA button opens channel in new tab

### General Responsiveness
- [ ] Test at desktop width (>=1024px)
- [ ] Test at tablet width (~768px)
- [ ] Test at mobile width (~375px)
- [ ] No major overlap/cutoff in key sections

---

## 2) Ads Rotation Section
- [ ] Ad image shows initially
- [ ] Image rotates every ~5 seconds
- [ ] After last image, text block appears
- [ ] Rotation restarts after text display period
- [ ] No console errors during rotation

---

## 3) Videos Section (`Latest Videos`)
- [ ] Loading spinner appears during fetch
- [ ] Video list renders without layout break
- [ ] Each video iframe loads
- [ ] Video titles render correctly
- [ ] Error state displays readable message if API fails

---

## 4) Comments & Rating UI
### Comments card
- [ ] Comment input accepts text
- [ ] `Post` button is clickable
- [ ] Form does not visually break layout

### Rating card
- [ ] Stars are visible (1–5)
- [ ] Clicking stars updates rating state (if wired)
- [ ] No JS errors on interaction

---

## 5) Gallery Section
### Initial Load
- [ ] Gallery container renders
- [ ] Empty state message appears when no images are returned
- [ ] If images exist, cards render correctly

### Image interactions
- [ ] Clicking image opens image viewer modal
- [ ] Viewer close (`×`) works
- [ ] Clicking backdrop closes viewer
- [ ] Left/right navigation buttons clickable
- [ ] ESC closes viewer

### Likes interactions
- [ ] Heart icon clickable
- [ ] Like count updates optimistically
- [ ] Re-click behavior respects “liked” state
- [ ] Keyboard like (Enter/Space on focused heart) works
- [ ] No duplicate rapid-like glitches

---

## 6) Services Section
For each service card (Burial, Wedding, Birthday, Corporate, Live Streaming):
- [ ] Card section is visible and styled correctly
- [ ] Expand/collapse interaction works
- [ ] Nested accordion package toggles open/close correctly
- [ ] No cross-card accordion conflict
- [ ] Content text remains readable on all viewports

---

## 7) Contact & About
- [ ] Contact email link opens mail client
- [ ] Social links are clickable and valid
- [ ] About section renders properly

---

## 8) Free Consultation Section
- [ ] Phone number visible
- [ ] `GET STARTED` button clickable
- [ ] Clipboard copy action works
- [ ] Alert confirms copied number

---

## 9) Upload Modal Full Flow (Critical + Extended)

### Open/close behavior
- [ ] Click navbar `Upload` → modal opens
- [ ] Click `Cancel` → modal closes
- [ ] Reopen modal starts at password section
- [ ] Click outside modal closes it

### Password section (primary issue area)
- [ ] Password input focus on modal open
- [ ] `Continue` button is clickable
- [ ] `Continue` with empty password shows validation message
- [ ] Wrong password shows auth error message
- [ ] Pressing Enter in password field triggers authenticate
- [ ] No dead button behavior (must respond on every click)

### Upload section (after successful auth)
- [ ] Upload section appears on valid auth
- [ ] `Back` arrow returns to password section
- [ ] `Change Password` opens change-password section
- [ ] `Close` button closes modal

### File select/drag-drop
- [ ] `Browse Files` opens file picker
- [ ] Clicking drop area opens file picker
- [ ] Dragover visual state appears
- [ ] Dropping valid image selects file
- [ ] Invalid type shows error
- [ ] Oversized file (>10MB) shows error
- [ ] Preview renders selected image
- [ ] Remove-file button clears selection

### Upload action
- [ ] `Upload Image` disabled until valid file chosen
- [ ] Clicking `Upload Image` shows progress bar and percent
- [ ] Success message appears on success
- [ ] Gallery refreshes after successful upload
- [ ] Modal auto-closes after success timeout
- [ ] Network/upload error shows readable error
- [ ] Upload button re-enables after completion/error

### Change password flow
- [ ] Open change-password section from upload section
- [ ] Current/new/confirm inputs accept text
- [ ] Eye toggle buttons show/hide password correctly
- [ ] Validation for empty fields works
- [ ] Validation for mismatch works
- [ ] Validation for min length works
- [ ] Save button disabled during request and restored afterward
- [ ] Success message shows and returns to upload section
- [ ] Failure message handled cleanly
- [ ] `Back to Upload` works

---

## 10) Chat Widget Flow
### Open/close
- [ ] Chat FAB visible and clickable
- [ ] Chat panel opens and closes correctly
- [ ] Initial assistant greeting appears

### Messaging
- [ ] Input accepts text
- [ ] Send button works
- [ ] Enter key sends message
- [ ] Pending indicator (`...`) appears then resolves
- [ ] Error message shown gracefully when chat API fails

---

## 11) Accessibility & Keyboard Smoke Checks
- [ ] Tab through primary controls in logical order
- [ ] Enter/Space activation works on interactive elements
- [ ] Modal controls reachable by keyboard
- [ ] ESC closes viewer modal

---

## 12) Regression Notes (record during execution)
- [ ] No new console errors introduced by recent Continue-button fix
- [ ] Cancel button still works
- [ ] Continue button now responds reliably
- [ ] Upload/change-password flows unaffected by fix

---

## Final Sign-off
- [ ] All critical paths passed
- [ ] Any failed cases documented with steps + screenshots
- [ ] Ready for production use
