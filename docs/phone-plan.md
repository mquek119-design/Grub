# Grub — Mobile & Phone Web Architecture & Plan

_Last updated: 2026-09-08. Status: Active Engineering & UX Plan. Built on initial foundations by Codex, enriched with real-world student house dynamics, Antigravity ergonomic design guidelines, and current codebase verification._

---

## 1. Vision & Core Principles

Grub is built around a clear operational split:
- **Phone is the daily participation device**: Used by all housemates (including the collector) on the go — joining/leaving meals, checking what's for dinner, cooking with greasy fingers in the kitchen, claiming leftovers, reviewing split costs, and sending payment via banking apps.
- **Desktop is the collector's command centre**: Used once a week by the designated collector to review the pooled trolley, hold delivery slots, and place the final Tesco order.

### Product Tenets
1. **One Unified Codebase**: One responsive Next.js App Router app. Zero separate mobile backends, zero forks, zero duplicate business logic.
2. **Device Size & Role Are Orthogonal**: The collector can use their phone for day-to-day meal joining and cooking; non-collectors can use laptops. Collector privileges stem from database role, never from viewport width.
3. **Ergonomic "Thumb-Zone" First**: Primary actions must sit within the lower 60% of the screen.
4. **Honest Supermarket Data**: Missing prices are rendered as "No price", never `£0.00`.
5. **No Funds in Custody**: Grub calculates arithmetic down to the penny, but payments are completed peer-to-peer (Monzo, Revolut, bank transfer).

---

## 2. Current Implementation Audit (Shipped vs Outstanding)

| Surface / Feature | Implementation State | Shipped Deliverables |
| :--- | :--- | :--- |
| **Global Navigation** | ✅ **Shipped** | `BottomNav.tsx` active below `md` with `pb-safe`, tab badges, tactile micro-animations (`active:scale-95`), and 96px chrome offset. |
| **Feed Screen** | ✅ **Shipped** | Pinned **Tonight's Dinner** card on mobile feed; directly launches full-screen Cook Mode with portion scaling when user cooks tonight. |
| **Week Plan** | ✅ **Shipped** | Sticky weekday jump rail (`lg:hidden sticky top-[72px]`) with smooth scroll to day cards (`[Today]`, `Mon`, `Tue`...). |
| **Cook Mode** | ✅ **Shipped** | **Kitchen Counter Experience**: Screen Wake Lock API (`navigator.wakeLock`), bold step typography, knuckle-tap checklist, and leftover logger. |
| **Split & Settle Up** | ✅ **Shipped** | **1-Tap Banking Links**: Direct Monzo (`monzo.me`) and Revolut (`revolut.me`) payment triggers; copyable bank details with instant feedback. |
| **Auth & Magic Links** | ✅ **Shipped** | Mobile-responsive login with 1-tap magic links, quick-jump email client buttons (Gmail/Outlook); iOS Safari auto-zoom prevention (`text-base` enforced). |
| **PWA & Standalone** | ✅ **Shipped** | Next.js manifest (`display: standalone`), SVG branded icons, and service worker push notification support. |
| **Calendar Sync** | ✅ **Shipped** | Live RFC 5545 Webcal / iCal subscription feed (`/api/calendar/[houseId]`) with native alarms for Apple/Google calendars. |
| **Avatar Studio** | ✅ **Shipped** | 5 unique Grub characters (Ricky, Onion, Bap, Beanie, Noodz) + 6 accessible accents; collision prevention (`Taken by [Name]`); initial letter + color conflict guards; custom pfp removed. |
| **Room Removal** | ✅ **Shipped** | Purged room numbers/names across all mobile UI (splits, balances, meal sheets, rosters, collector panels) to reduce visual clutter. |
| **Mobile Onboarding** | ✅ **Shipped** | Multi-step touch flow: house setup, kitchen appliance buttons with badge counters, supermarket selector linked to delivery/collection, and responsive layout. |
| **Budget Slider & Stocky** | ✅ **Shipped** | Touch-friendly £10–£100 slider with 4 progressive student tiers (Frugal, Student, Gym, Premium) and visual mascot evolution nuggets (coins, weights, gold bar). |
| **Dietary Profile Sync** | ✅ **Shipped** | `/account` panel fully synced with onboarding habits: interactive budget slider, Stocky mascot, diet safety chips, custom allergy manager, and 2-column meal vibe cards. |

---

## 3. Ergonomics & The "Thumb-Zone"

Modern student phones (iPhone 14/15/16, Samsung Galaxy S23/S24, Google Pixel) range from 390px to 430px wide and over 850px tall. One-handed use has physical constraints:

```
┌───────────────────────────┐
│     HARD (Top 20%)        │ <- Status bar, page title, read-only metadata
├───────────────────────────┤
│    STRETCH (Middle 30%)   │ <- Content scrollers, day cards, ingredient lists
├───────────────────────────┤
│                           │ <- Primary interactive zone:
│    NATURAL (Bottom 50%)   │ <- "Join meal", "I've Paid", "Swap brand",
│                           │ <- Bottom sheets, Steppers, Tab Navigation
└───────────────────────────┘
```

### Mobile Layout Directives
1. **Never Put Destructive or Primary Actions at the Top**: "Join", "Leave", "Confirm Payment", and "Add to Basket" must be in the bottom two-thirds or inside a bottom sheet.
2. **Bottom Sheets Over Modals**: Replace desktop pop-up modals with slide-up bottom sheets (`max-h-[85vh]`, rounded top corners `rounded-t-3xl`, tactile grab handle `w-12 h-1.5 bg-outline-variant/60 rounded-full mx-auto my-2`).
3. **Keyboard Avoidance**: Floating action bars (e.g. mobile checkout bar, add item bar) must listen to `visualViewport.height` or use CSS `dvh` to float cleanly above the on-screen keyboard instead of obscuring input fields.
4. **Input Zoom Prevention**: All `<input>`, `<select>`, and `<textarea>` elements must have font size $\ge 16\text{px}$ (`text-base` or `text-[16px]`) on mobile to prevent iOS Safari from jarringly zooming the page on focus.

---

## 4. Key Student Mobile Workflows

### Workflow A: The 6:00 PM Commute Check ("What am I eating?")
- **Context**: Walking home from campus or sitting on the bus.
- **Needs**: Instant 3-second answer to:
  1. *What's for dinner tonight?*
  2. *Who is cooking?*
  3. *Am I in or out?*
  4. *Can I still join or bail?*
- **Solution**: The Feed header on mobile prominently pins **Tonight's Dinner** with a 1-tap Join/Leave toggle and cooking time.

### Workflow B: Kitchen Counter Cook Mode ("Dirty Hands")
- **Context**: Phone propped up against a cereal box or kettle on the kitchen counter while cooking.
- **Needs**:
  - The screen must **not** sleep while chopping garlic or handling raw meat.
  - Text must be legible from 2 to 3 feet away.
  - Step progress can be marked with a knuckle tap.
- **Solution**:
  - **Screen Wake Lock API**: Request wake lock upon opening Cook Mode:
    ```ts
    if ('wakeLock' in navigator) {
      const wakeLock = await navigator.wakeLock.request('screen');
    }
    ```
  - **Counter UI**: 22px bold step instructions, large swipeable step cards, and a toggleable ingredient checklist.

### Workflow C: Settling Up ("I've Paid")
- **Context**: Friday night after delivery. Collector posted the split.
- **Needs**: Housemates want to pay immediately via their mobile banking apps without manually writing down bank details.
- **Solution**:
  - **1-Tap Banking Links**: Support custom payment URLs configured by the collector:
    - `https://monzo.me/<username>/<amount>`
    - `https://revolut.me/<username>/<amount>`
  - Tapping **"Pay via Monzo"** or **"Pay via Revolut"** opens the native banking app with amount pre-populated.
  - Retain copyable Sort Code and Account Number buttons with instant "Copied!" feedback as a fallback.
  - Instant tactile **"I've Paid"** toggle with undo grace period.

### Workflow D: Cross-Device Collector Handoff
- **Context**: Collector plans on phone during the week, but needs their laptop to execute the final Tesco order with session cookies.
- **Needs**: Zero confusion about what can and cannot be done on phone.
- **Solution**:
  - The phone Basket view clearly indicates:
    > *"All items pooled · £78.22 total (Clears Tesco £25 min) · Open on your laptop to run checkout."*
  - Handoff notification badge on desktop feed when the weekly cutoff arrives.

---

## 5. PWA (Progressive Web App) Specifications

Transforming the mobile web app into an installable PWA gives students a native app feel on both iOS and Android:

### 1. Web App Manifest (`public/manifest.json`)
```json
{
  "name": "Grub — Student Household Food",
  "short_name": "Grub",
  "description": "Plan meals together, build one Tesco shop, split fairly.",
  "start_url": "/feed",
  "display": "standalone",
  "background_color": "#FAFAF7",
  "theme_color": "#1B4332",
  "icons": [
    {
      "src": "/brand/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/brand/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### 2. Standalone Experience Benefits
- Removes browser URL bar and bottom Safari navigation chrome, granting **~110px of extra screen space**.
- Prevents accidental back-swipe gestures when interacting with horizontal recipe carousels.
- Adds branded splash screen on startup.

---

## 6. Implementation Phases

### Phase 1: Touch & Ergonomic Hardening (High Priority)
- [x] Add `visualViewport` resize listener / `dvh` CSS variable to keep floating basket and split bars above virtual keyboards.
- [x] Ensure all form inputs have `text-[16px]` to permanently disable iOS Safari auto-zoom (`globals.css`).
- [x] Implement sticky horizontal weekday selector on `WeekPlan.tsx` (`Mon · Tue · Wed...`) so mobile users jump directly to any day without infinite scrolling.
- [x] Audit bottom sheets: ensure touch drag-handle dismiss and backdrop blur.

### Phase 2: Cook Mode Counter Experience (Anki Flashcard Deck)
- [x] Integrate Screen Wake Lock API in `CookModeModal.tsx` / Cook Mode (`navigator.wakeLock`).
- [x] Anki Flashcard UI: Single physical-feeling card center stage with 3D stacked deck visual cues, segmented deck progress bar, and card flip capability (Action front / Ingredients & Tips back).
- [x] Knuckle-friendly Anki response buttons (Previous, Flip, Done / Next Step with 56px touch targets).
- [x] Smart step classification (PREP, SEAR, SIMMER, BAKE, MIX, SEASON, SERVE badges) and auto-matched step ingredient chips.
- [x] Built-in interactive countdown timers with Web Audio chime when cooking intervals are detected in step text.
- [x] Deck Drawer sheet to jump across cards or check full recipe ingredients.
- [x] Integrate 1-tap leftover logging to fridge board upon completion ("All Cards Mastered! 🎉").
- [x] Enforce phone exclusivity: desktop users receive a dedicated kitchen-counter companion modal with live QR code and mobile link; full screen cooking interface is reserved for phone.

### Phase 3: 1-Tap Banking Deep Links
- [x] In Account Settings &rarr; Payment details, add optional fields for `Monzo handle` and `Revolut username` (`AccountPanels.tsx`).
- [x] In `/split`, render direct "Pay via Monzo" and "Pay via Revolut" deep link buttons that pre-fill the exact pence balance (`PayPanel.tsx`).

### Phase 4: PWA Packaging & Mascot
- [x] Create Next.js Web App Manifest (`src/app/manifest.ts`) with standalone display mode.
- [x] Add Apple Touch Icon and web app meta tags in `src/app/layout.tsx`.
- [x] Add gentle "Install Grub / Add to Home Screen" PWA install prompt card for mobile visitors (`InstallPrompt.tsx`).
- [x] Launch Stocky the Bouillon Cube mascot with multi-mood vector component (`Stocky.tsx`).

### Phase 5: Avatar Studio & Flat Identity Collision Prevention
- [x] Launch 5 unique Grub food character glyphs (Ricky Rice, Onion, Bap, Beanie, Noodz) with accessible WCAG AAA accent colors (`AvatarGlyphs.tsx`, `Avatar.tsx`).
- [x] Prevent character collision: taken characters render disabled with `Taken by [Name]` in mobile rosters and setup.
- [x] Prevent initial + color collision: housemates with the same first initial cannot select the same accent color.
- [x] Remove custom photo URL input and file upload friction on mobile devices; avatars are strictly unique character glyphs or initial badges.
- [x] Purge room numbers/names across all mobile UI surfaces (split panels, rosters, meal options, balances, planner).

### Phase 6: Mobile Onboarding, Budget Slider & Stocky Nuggets
- [x] Mobile-optimised multi-step onboarding flow (`/onboarding/profile`, `/onboarding/create`, `/onboarding/join`).
- [x] Direct appliance selector with tactile buttons and selected badge counts.
- [x] Supermarket selection dynamically linked to delivery vs collection choice with clear store tags and minimum spend guides.
- [x] Progressive Stocky mascot nuggets across 4 budget tiers: Frugal (£10–£25 with coin floor nugget), Student (£26–£45), Gym (£46–£70 with dumbbell weight nugget), Premium (£71–£100 with gold bar nugget).
- [x] Responsive layout fix preventing word-spacing expansion on narrow mobile screens at £35.

### Phase 7: Dietary Profile & Habits Synchronization
- [x] Create unified shared dietary module (`src/lib/dietary.ts`) for `DIETS`, `VIBES`, `getBudgetTier`, `parseDietaryPreferences`, and `formatDietaryBadge`.
- [x] Synchronize `/account` Dietary Profile with onboarding setup: interactive budget slider, Stocky mascot, diet safety chips, custom allergy manager, and meal vibe cards.
- [x] Format profile hero tags with custom color coding across mobile account and house settings.

---

## 7. Automated Mobile Acceptance Testing

Mobile responsiveness must be verified through automated Playwright tests across exact device profiles:
- **iPhone 13 / 14 / 15**: 390 x 844 CSS px (`@playwright/test` `devices['iPhone 14']`)
- **iPhone 15 Pro Max**: 430 x 932 CSS px
- **Google Pixel 7**: 412 x 915 CSS px
- **Small Phone**: 320 x 568 CSS px (SE / compact benchmark — no horizontal overflow)

### Automated Test Checklist
1. Zero horizontal page scrolling at 320px width (`window.innerWidth === document.documentElement.clientWidth`).
2. BottomNav and floating action bars never overlap interactive elements.
3. Forms submit cleanly without layout shifts or keyboard trapping.
4. Modals and bottom sheets close cleanly with back button, backdrop tap, and close icon.
5. All buttons and interactive icons pass $\ge 44\times 44\text{px}$ touch target assertions.
