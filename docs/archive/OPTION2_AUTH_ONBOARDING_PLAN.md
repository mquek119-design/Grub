# Option 2: Complete Auth & Onboarding Flow Testing

**Objective**: Walk the entire signup/login/onboarding journey end-to-end. Test all flows, error states, and edge cases.

**Status**: Planning  
**Focus**: Desktop (1440px) only  
**Timeline**: 2-3 days with parallel agents  
**Agents**: 3-4 concurrent

---

## Flows to Test

### Flow 1: New User Signup → Onboarding → Feed
**Path**: `/welcome` → Sign up → `/onboarding/signup` (email) → `/onboarding/instructions` → `/onboarding` (house picker) → `/onboarding/create` (create house) → `/onboarding/invite` (add housemates) → `/` (feed)

**Steps**:
1. Load `/welcome` (signed out)
2. Click "Sign up"
3. Enter email, submit
4. Verify "Check your inbox" message
5. Follow auth link (simulated or via email)
6. Land on `/onboarding/instructions`
7. Click "Let's go"
8. Land on `/onboarding` (house creation picker)
9. Click "Create a house"
10. Fill house form (name, delivery day, cutoff settings)
11. Submit → land on invite page
12. Add housemate emails (optional, can skip)
13. Submit → land on `/` (feed)

**Validation**:
- All pages load without errors
- Forms submit successfully
- Redirects work correctly
- Data persists (created house exists in DB)
- Grub voice on all messages (no exclamation marks, plain language)

---

### Flow 2: Existing User Login
**Path**: `/welcome` → Sign in → `/login` (email) → Auth callback → `/` (feed)

**Steps**:
1. Load `/welcome` (signed out, no account yet)
2. Click "Sign in" link (or go to `/login`)
3. Enter email for existing account
4. Submit → "Check your inbox"
5. Follow auth link
6. Should redirect to `/` (feed) or `/onboarding` if no house

**Validation**:
- Auth flow works
- Redirect to correct destination (feed if has house, onboarding if not)
- Session persists (can refresh and stay logged in)

---

### Flow 3: Join Existing House via Invite
**Path**: New user gets invite code → `/onboarding/invite?code=...` → Creates account → Joins house → Feed

**Steps**:
1. Have existing house create invite link
2. New user goes to invite link
3. Should ask for email/password (signup)
4. After auth, should auto-join house
5. Should redirect to feed

**Validation**:
- Invite code validation works
- New user auto-joins correct house
- User appears in housemates list
- Feed shows the house's meals

---

### Flow 4: Skip Onboarding Instructions
**Path**: Sign up → Instructions → Click "Skip" → House creation

**Steps**:
1. Go through signup to `/onboarding/instructions`
2. Click "Skip" button (if present)
3. Should go to `/onboarding` (house picker)
4. Should not require going through instructions again

**Validation**:
- Skip button works
- Instructions can be revisited anytime
- Flow continues normally

---

## Error States to Test

### Authentication Errors
- [ ] Invalid email format — error message displays
- [ ] Account doesn't exist (but trying to sign in) — helpful error
- [ ] Expired/invalid magic link — "link expired or was already used" message (Grub voice)
- [ ] Multiple attempts with same email — rate limiting (if implemented)

### House Creation Errors
- [ ] Missing house name — validation error
- [ ] Invalid cutoff time — validation error
- [ ] Duplicate house name (if validated) — clear error message
- [ ] Invalid delivery day selection — validation error

### Invite Flow Errors
- [ ] Invalid invite code — "doesn't exist" or similar
- [ ] Expired invite code — appropriate message
- [ ] User already in house — prevents duplicate join
- [ ] Non-existent email added — validation or error handling

### Session Errors
- [ ] Logout works (if implemented)
- [ ] Session timeout — graceful redirect to login
- [ ] Navigating to protected route while logged out — redirect to login with `?next=`
- [ ] Browser refresh maintains session

---

## Data Validation Tests

### Forms Should Validate Before Submit
- [ ] House name: required, max length enforced
- [ ] Delivery day: required, valid day selected
- [ ] Cutoff time: required, valid time format
- [ ] Email: required, valid email format
- [ ] Invite code: required when joining by invite

### Database State
- [ ] New house created with correct data
- [ ] User assigned to house
- [ ] Room assignments work (if applicable)
- [ ] Housemates properly linked
- [ ] Invite codes cleaned up after use

---

## Voice & Copy Tests

All user-facing messages must match Grub voice:
- ✓ Dry, plain, British
- ✓ No exclamation marks on routine messages
- ✓ No "Let's", "Great!", "Awesome!" language
- ✓ Error messages specific and helpful

**Examples to check**:
- "Check your inbox" (not "Check your inbox!")
- "That link has expired or was already used. Request a new one." (not "...already used. Try again!")
- "Create a house" (not "Let's create a house!")
- "All set" (not "All set! 🎉")

---

## Responsive Testing (1440px Desktop)

- [ ] All pages responsive at 1440px
- [ ] Form fields properly sized
- [ ] Buttons 44×44px minimum (touch target)
- [ ] No horizontal scroll
- [ ] Text readable (not too narrow, not too wide)
- [ ] Images scale correctly
- [ ] Modals/sheets display properly

---

## Success Criteria

- [ ] Complete signup → feed flow works without errors
- [ ] Complete login → feed flow works without errors
- [ ] Invite flow works (join existing house)
- [ ] All error states tested and display helpful messages
- [ ] All messages match Grub voice
- [ ] Forms validate before submit
- [ ] Database state correct after each flow
- [ ] Responsive at 1440px
- [ ] No console errors (except harmless dev warnings)
- [ ] Build passes `npm run verify`
- [ ] Test report documenting all flows and results

---

## Parallel Execution

**Agent A: Signup Flow** (2-3h)
- New user signup → instructions → house creation → feed
- Test form validation, redirects, success path

**Agent B: Login Flow** (1-2h)  
- Existing user login, session persistence
- Redirect logic (feed if has house, onboarding if not)

**Agent C: Invite & Error States** (2-3h)
- Join existing house via invite
- All error scenarios (invalid codes, expired links, etc.)
- Error message validation (Grub voice)

**Agent D: Data Validation** (1-2h)
- Database state verification after each flow
- Form validation, constraint checking
- Room assignments (if applicable)

---

## Definition of Done

- All 4 flows tested end-to-end
- All error scenarios documented
- No critical bugs found (or found and logged)
- Comprehensive test report with:
  - What works
  - What's broken
  - Screenshots of key states
  - Copy audit (Grub voice)
- Responsive verified at 1440px
- Build clean

---

## Known Gaps / Unknowns

- Is logout implemented? (check if user can sign out)
- Are invite codes time-limited? (check expiration)
- Does app validate duplicate house names?
- Is there rate limiting on signup attempts?
- Can user change email after signup? (probably not needed, but note)

