# Option 3: Protected Routes Deep-Dive Audit

**Objective**: Test all 10+ authenticated routes end-to-end. Document defects, broken flows, missing states.

**Focus**: Desktop (1440px) only  
**Timeline**: 2-3 days with parallel agents  
**Agents**: 3-4 concurrent

---

## Routes to Audit

### Primary Routes (Tab-based)
1. **`/` (Feed)** — Countdown, payment status, week overview, nudges
2. **`/plan` (Plan Tab)** — Week as day cards, recipe browser, add meal flow
3. **`/recipes` (Recipes)** — Recipe browser, search, filters, quick-add sheet
4. **`/basket` (Basket)** — Basket review, own-brand toggle, checkout button
5. **`/split` (Split)** — Split breakdown, collector view, payment status, ledger

### Secondary Routes (Settings & History)
6. **`/account` (Account Settings)** — Profile, dietary prefs, payment details
7. **`/settings` (House Settings)** — House config, members, cutoff times
8. **`/pantry` (Pantry)** — Pantry items, low stock alerts, CRUD
9. **`/leftovers` (Leftovers)** — Leftover board, claiming, guests
10. **`/split/reconcile` (Reconciliation)** — Substitution handling, money math
11. **`/split/balances` (Balances/Ledger)** — Payment history, per-item breakdown

---

## Test Checklist Per Route

For each route, verify:

### Layout & Responsiveness
- [ ] Page loads at 1440px desktop
- [ ] No horizontal scroll
- [ ] All elements visible and clickable
- [ ] Text readable (not too compressed)
- [ ] Images scale properly
- [ ] Cards/sections properly spaced
- [ ] Navigation works (back buttons, tabs, links)

### Data Display
- [ ] Data loads without errors (no spinners stuck)
- [ ] Empty states show when appropriate (no fake data)
- [ ] Figures are accurate (sums, counts, calculations)
- [ ] Dates/times display correctly
- [ ] Numbers formatted properly (currency, percentages)

### Interactions
- [ ] Buttons clickable, proper size (44×44px minimum)
- [ ] Forms submit without errors
- [ ] Filters/searches work
- [ ] Modals/sheets open and close properly
- [ ] Navigation between routes works

### Console Health
- [ ] No JavaScript errors (except harmless dev warnings)
- [ ] No TypeScript errors in dev tools
- [ ] No failed API calls (404s, 500s)
- [ ] Network requests complete successfully

### Grub Voice
- [ ] Copy is plain, dry, British
- [ ] No exclamation marks on routine messages
- [ ] Error messages are clear and helpful
- [ ] Labels/hints match brand voice

---

## Route-Specific Tests

### Feed (`/`)
- [ ] Countdown displays (days/hours/minutes to cutoff)
- [ ] "Your Input Required" card shows (or "You're In" if participated)
- [ ] "This Week's Plan" shows all days with meals
- [ ] Avatar stacks show correct housemates
- [ ] "Shared Meal" badge counts correctly
- [ ] Payment status section shows (if applicable)
- [ ] Pantry low-stock alerts display
- [ ] Leftovers board shows (if any)
- [ ] All links work (to /plan, /basket, /split, etc.)

### Plan (`/plan`)
- [ ] Week renders as day cards (Mon–Fri, weekends if planned)
- [ ] Meal cards show: recipe, cook, diners, join/leave buttons
- [ ] "Add a meal" button works
- [ ] Recipe browser appears below meals
- [ ] Filters work (Quick, Budget, Pantry, Veggie)
- [ ] Search works
- [ ] "Add recipe" button for new recipes
- [ ] Overlap suggestions display (if applicable)
- [ ] Can join/leave meals

### Recipes (`/recipes`)
- [ ] Recipe grid loads with all recipes
- [ ] Search bar works
- [ ] Filter chips work (Quick, Budget, Pantry, Veggie, Dietary)
- [ ] Quick-add sheet opens when clicking recipe
- [ ] Day/sitting picker in sheet
- [ ] "Add" button submits without errors
- [ ] After adding, redirects back to plan
- [ ] "Add Recipe" button works
- [ ] Image thumbnails load

### Basket (`/basket`)
- [ ] Basket items display with: name, qty, unit price, total, allocation
- [ ] Own-brand toggle works (if available)
- [ ] Totals calculate correctly (sum of items)
- [ ] "I've checked this" button works
- [ ] "Proceed to Tesco" button works (or shows message)
- [ ] Empty state shows if no basket
- [ ] "Needs pack data" warning shows for unpriced items

### Split (`/split`)
- [ ] Split total displays clearly
- [ ] Collector view shows: outstanding balances, payment status
- [ ] Non-collector view shows: amount owed, payment button
- [ ] Split breakdown shows lines with: item, allocation, amount
- [ ] "I've Paid" button works (or "Confirm Payment" for collector)
- [ ] Expense panel shows (if any expenses)
- [ ] Ledger/history visible
- [ ] Empty state if no split yet

### Account (`/account`)
- [ ] Profile section loads
- [ ] Dietary preferences show (if set)
- [ ] Payment details panel shows (collector details or form)
- [ ] Can edit settings
- [ ] Save button works
- [ ] Success/error messages display

### Settings (`/settings`)
- [ ] House name, delivery day, cutoff settings visible
- [ ] Members list shows with rooms/roles
- [ ] Can edit settings (if permitted)
- [ ] House invite code visible (if applicable)
- [ ] Help text clear and readable
- [ ] Danger zone section (if present)

### Pantry (`/pantry`)
- [ ] Pantry items list displays
- [ ] Shared vs personal items distinguished
- [ ] Low-stock indicators show
- [ ] Can add items (button/form)
- [ ] Can mark as used/consumed
- [ ] Empty state if no items

### Leftovers (`/leftovers`)
- [ ] Leftover items display with: dish, cook, expiry, guests
- [ ] Can claim (if not cook)
- [ ] Can add to own leftovers (if cook)
- [ ] Days remaining shows correctly
- [ ] "Probably eaten by now" message for old items
- [ ] Empty state if none

### Reconciliation (`/split/reconcile`)
- [ ] Items list shows: ordered qty, received qty, decision
- [ ] Can mark received/partial/missing
- [ ] Quantity stepper works
- [ ] Substitutions list shows (if any)
- [ ] Accept/reject substitution buttons work
- [ ] Totals update based on received quantities
- [ ] "Finalize" button saves reconciliation

### Balances (`/split/balances`)
- [ ] Ledger shows all transactions (splits + expenses)
- [ ] Dates, amounts, recipients clear
- [ ] Totals calculated correctly
- [ ] Can filter/search (if implemented)
- [ ] Export/share functionality (if available)

---

## Defects to Document

For any defects found, record:
- **Route**: Which page
- **Issue**: What's broken
- **Steps**: How to reproduce
- **Expected**: What should happen
- **Actual**: What actually happens
- **Screenshot**: Evidence (if visual issue)
- **Severity**: Critical / High / Medium / Low

---

## Success Criteria

- [ ] All 11 routes tested at 1440px
- [ ] Data loads correctly on all routes
- [ ] All interactive elements work
- [ ] No console errors (except harmless warnings)
- [ ] Responsive at desktop (no layout breakage)
- [ ] All calculations/totals verified
- [ ] Empty states show when appropriate
- [ ] Comprehensive defect log created
- [ ] Feature map (what works, what doesn't) documented
- [ ] Copy audited for Grub voice

---

## Parallel Execution

**Agent A: Feed, Plan, Recipes** (2-3h)
- Core planning routes
- Test meal planning flow
- Document defects

**Agent B: Basket, Split, Account** (2-3h)
- Money-related routes
- Test money calculations
- Check payment flows

**Agent C: Settings, Pantry, Leftovers, Reconciliation, Balances** (2-3h)
- Secondary routes
- Test money math edge cases
- Check data integrity

---

## Definition of Done

- Complete feature map: what works, what's broken
- Defect log with screenshots and reproducible steps
- Copy audit: voice consistency checked
- Data validation: calculations verified against manual math
- Responsive verified at 1440px (no horizontal scroll, no layout breaks)
- Build still passes `npm run verify`
- Test report published

