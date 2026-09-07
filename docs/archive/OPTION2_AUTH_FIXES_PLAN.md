# Option 2: Remaining Auth Issues — Fixes

**Objective**: Fix two remaining issues from auth testing

**Timeline**: 1-2 hours with parallel agents  
**Agents**: 2 concurrent

---

## Issue 1: Join Flow Pre-Auth

**Problem**: Join/invite form requires user to already be authenticated. When new user tries to join via invite link (`/onboarding/invite?code=XXX`), they can't because they're not signed in.

**Expected Flow**:
1. New user gets invite link: `/onboarding/invite?code=ABC123`
2. Clicks link, lands on page
3. Should ask for email to sign up (or use existing account)
4. After auth, auto-join house with that invite code
5. Redirect to feed

**Current Flow**:
1. User clicks invite link
2. Lands on join form
3. Form requires auth (fails with "Not authenticated")
4. User has no way to sign up + join in one flow

**Solution**:
Modify `/onboarding/invite/page.tsx` and `InviteForm.tsx` to:
- Detect if user is authenticated
- If NOT authenticated: show signup form first (reuse SignupForm logic)
- After signup/auth callback, auto-populate invite code and join
- If authenticated: show join form as normal

**Implementation**:
1. Check `getCurrentUserOrNull()` in page component
2. If not authenticated, show email signup form
3. On successful auth, redirect back to same page with `?code=XXX` still in URL
4. Form detects user is now authenticated and shows join form
5. User clicks "Join house", form submits with invite code
6. Redirect to feed

**Files to modify**:
- `src/app/onboarding/invite/page.tsx` — Add auth check
- `src/app/onboarding/invite/InviteForm.tsx` — Add conditional signup flow
- Consider: Reuse `SignupForm` component or inline signup logic

**Testing**:
- Click invite link as unauthenticated user
- See signup form (or email prompt)
- Complete signup
- Auto-redirect back to join form with code pre-filled
- Join house successfully
- Land on feed
- Verify user added to house

**Success Criteria**:
- Unauthenticated users can join via invite by signing up
- Auth code is preserved through redirect
- User auto-joins correct house
- Complete flow: invite link → signup → join → feed (all in one session)
- Build passes

---

## Issue 2: Form Field Preservation After Error

**Problem**: When forms show validation errors, all fields are cleared. Users have to re-enter data to try again.

**Expected**: Form fields should retain user input so they can see what caused the error and correct it without retyping everything.

**Current Code**:
- `CreateHouseForm.tsx` uses `useActionState` which manages state
- On error, state updates but form fields aren't preserved

**Solution**:
Modify form components to preserve input values in client-side state:

**For CreateHouseForm**:
1. Add `useState` for each field (name, deliveryDay, cutoffDay, cutoffTime)
2. Bind to form inputs via `value={name}` and `onChange={setName}`
3. On error, fields remain filled from state
4. User can edit and resubmit

**For InviteForm** (when implemented):
1. Same pattern: `useState` for code and name
2. Preserve values on error
3. User can correct and retry

**Implementation**:
- Keep `useActionState` for server-side state
- Add client-side `useState` for form values
- Bind inputs bidirectionally
- On error, values stay in form for editing

**Example**:
```tsx
const [houseName, setHouseName] = useState(prefill?.houseName ?? '');

<input
  name="name"
  value={houseName}
  onChange={(e) => setHouseName(e.target.value)}
  required
  maxLength={60}
/>
```

**Testing**:
- Try to create house with missing name → validation error
- Error message displays
- **House name field should still have previous value** (not cleared)
- Edit the name to be valid
- Re-submit → should succeed

**Success Criteria**:
- Form errors display without clearing fields
- User can read their previous attempt
- User can easily correct and retry
- Build passes
- All forms follow this pattern

---

## Parallel Execution

**Agent A: Join Flow Pre-Auth** (1-1.5h)
- Modify invite page and form for signup flow
- Handle auth callback redirect back to invite
- Test unauthenticated → signup → join flow

**Agent B: Form Field Preservation** (0.5-1h)
- Add `useState` to CreateHouseForm for field values
- Bind inputs bidirectionally
- Test error case preserves values
- Apply pattern to other forms (SignupForm if needed)

---

## Definition of Done

- [ ] Unauthenticated users can join via invite link
- [ ] Auth code preserved through signup/auth redirects
- [ ] Form fields retained after validation errors
- [ ] User can correct and resubmit without retyping
- [ ] Build passes `npm run verify`
- [ ] All flows tested at 1440px desktop
- [ ] Commits created with clear messages

