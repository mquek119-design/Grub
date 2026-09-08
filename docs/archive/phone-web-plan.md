# Grub phone web plan

Status: proposed implementation plan; no UI changes implemented by this document.

## Objective

Make Grub usable entirely from a phone for household members who do not place the Tesco order, while preserving desktop as the primary workspace for planning and ordering the household shop.

Ship one responsive web application with shared accounts, routes, household data, and business rules. Adapt presentation and task priority to the available space. Do not create a separate mobile product or fork the desktop application.

## Product decisions

- Desktop remains the primary ordering workspace. Preserve its visual identity, information density, and existing workflows.
- Phone members can complete the participation loop: join a house, choose meals, add personal items, cook, manage leftovers, inspect their share, and report payment.
- Device size and household role are independent. A collector can use a phone for everyday tasks; a non-collector can use desktop. Resolve collector permissions from the active week's existing rules, never from viewport size.
- Tesco checkout continues through the supported desktop ordering environment. Opening the hosted app on a laptop alone does not enable local Tesco automation.
- Keep the existing five destinations: Feed, Plan, Basket, Split, and Leftovers. Recipes and pantry stay within Plan; account and household settings remain reachable through the app header.
- Preserve all existing money, cutoff, capacity, dietary, payment-confirmation, and reconciliation rules.

## Existing foundations and gaps

These observations come from source inspection, not a completed phone browser audit.

| Area | Current foundation | Work to assess or complete |
| --- | --- | --- |
| Navigation | `BottomNav` already appears below the `md` breakpoint; `AppChrome` reserves bottom space | Check safe areas, small screens, text enlargement, and overlap with page actions |
| Plan | `WeekPlan` uses one column below `lg`, two above | Make today's meals and participation easy to find without a long scroll |
| Recipes and meal options | Responsive sheets with bounded height and scrolling | Verify keyboards, long content, focus, and touch interactions |
| Split | Responsive columns, collector/member branches, copyable payment details | Prioritise the member's amount, payment stage, and next action |
| Basket | Desktop checkout card plus a separate fixed action area below `lg` | Adapt the existing phone action area to role and ordering availability; do not add another competing footer |
| Shared state | Supabase Realtime is mounted in the shared app shell | Verify refresh after reconnect and cross-device changes |
| Installation and reminders | No manifest, service worker, or push implementation found in the reviewed source | Treat installation and reminders as a later, explicit workstream |

## Experience by screen

### Feed

The first phone screen should answer: what am I eating, what needs my attention, and when is the deadline?

- Prioritise the existing next-action card, then today's meal and relevant household updates.
- Link directly to the affected meal, plan, or split wherever practical.
- Show planning cutoff and order/delivery status with understandable dates and times.
- Keep collector-specific next actions conditional on role. Avoid showing Tesco setup tasks to ordinary members.
- Keep secondary household information available below the primary tasks.

### Plan

- Keep the full week accessible in a single-column list on phones. Initially focus attention on today for the current week without making other days difficult to reach.
- Preserve week switching and make the selected week clear.
- Each meal exposes its name, sitting, participants, the current user's participation, and a clear join/leave action when allowed.
- Put guests, capacity, cook offers, and other secondary actions in the existing meal options sheet.
- Explain closed planning and full meals beside the affected action, using existing eligibility rules.
- Keep adding a meal and browsing recipes accessible without navigating through collector tools.
- Preserve desktop's wider overview and existing information hierarchy.

### Recipes and cooking

- Support searching, filtering, opening a recipe, and adding it to a selected day and sitting on a phone.
- Make recipe titles, ingredient quantities, servings, and cooking instructions readable without horizontal scrolling.
- Retain recipe creation and editing on phone with stacked fields and visible validation; long ingredient forms may scroll.
- Test cook mode independently: close control, long steps, quantities, and scroll position must remain usable.
- Preserve unsaved input after recoverable errors. Do not silently discard recipe work when a request fails.

### Basket

For members, lead with their personal additions, relevant cost information, and order status.

- Keep adding and editing personal items available subject to existing planning rules.
- Keep household basket contents and the member's share inspectable, with detailed breakdowns behind explicit disclosure where useful.
- Show estimated or incomplete pricing honestly; missing prices must not appear as free items.
- Replace irrelevant collector checkout actions with useful member status or actions.
- For a collector on phone, provide a clear desktop handoff explaining the supported ordering environment and that saved household changes will be available there.
- Reuse the existing saved plan and basket. Do not create a second checkout state or attempt to move Tesco session credentials to the phone.
- Test the current fixed basket footer against bottom navigation, safe areas, the keyboard, and tablet widths.

### Split

- Lead with the current user's amount and whether it is an estimate, awaiting delivery checks, ready to pay, or awaiting collector confirmation.
- Keep item-by-item workings available; simplify presentation without hiding the basis of the charge.
- Keep payment details individually copyable and make long links or notes wrap safely.
- Retain the existing “I've Paid” and undo flow, including pending, error, and confirmation states.
- Never imply Grub moves funds or verifies a bank transfer.
- Preserve the delivery-check gate and collector confirmation rules.
- Keep collector review actions accessible where practical; dense reconciliation can retain desktop-oriented presentation with clear guidance if it cannot yet be completed comfortably on phone.

### Leftovers and pantry

- Support browsing, adding, and claiming leftovers through existing rules and actions.
- Make quantities, ownership, and availability legible in a single-column layout.
- Keep reporting running-low staples and updating pantry items accessible from Plan.
- Ensure sheets and forms remain usable with the keyboard open.

### Joining, account, and settings

- A member must be able to open an invite, authenticate, join a household, and reach a useful first screen entirely on phone.
- Test the actual email-link return path and preserve invite context through authentication.
- Keep dietary preferences, personal details, and relevant household preferences editable.
- Make Tesco setup guidance specific to the collector and supported ordering environment.
- Preserve existing server-side permissions; hiding controls is not access control.

## Responsive and interaction requirements

- Reuse current tokens, components, typography, and breakpoints. Add narrowly scoped responsive changes rather than global desktop restyling.
- Check the existing `md` navigation and `lg` checkout transitions together so the intermediate tablet layout has no missing or duplicated controls.
- Use at least 44 by 44 CSS pixel touch areas for primary controls and icon buttons, with enough separation to avoid accidental taps.
- Avoid horizontal page scrolling at 320 CSS pixels. Wrap long names, recipe titles, payment details, and validation messages.
- Keep primary form text comfortably readable; use at least 16px input text on phone.
- Account for browser chrome, device safe areas, and the on-screen keyboard. Only one page-level sticky action region should compete with the persistent navigation.
- Sheets must have a visible close action, accessible labels, focus management, and scrollable content. Closing restores focus to the trigger.
- Preserve keyboard navigation, visible focus, reduced-motion preferences, and readability at enlarged text settings.
- Use pending states to prevent duplicate submissions and show actionable errors near the task. Do not rely only on transient toast messages.
- When disconnected, do not claim a change is saved. Refresh relevant shared data after reconnect or returning to the app; handle server rejection of stale actions.

## Implementation approach

- Keep existing Next.js routes, queries, server actions, and Supabase policies as the source of truth.
- Prefer CSS layout changes and small shared component adaptations. Use distinct compact and wide presentation components only where the interaction meaningfully differs.
- Share calculation and mutation logic between presentations. Avoid duplicated hidden forms, competing subscriptions, and separate mobile money calculations.
- Derive role and plan state on the existing authenticated path. Use client state for local presentation, not for authorization.
- Preserve usable URLs and browser back behavior when opening details and switching weeks.
- Phone participation should use the hosted app and the same household backend as the collector's supported desktop instance. Verify that deployment configuration supports this before calling the cross-device flow complete.

## Delivery phases

### 1. Establish the baseline

1. Capture authenticated Feed, Plan, Recipes, Basket, Split, Leftovers, onboarding, and settings at phone and desktop widths.
2. Inspect member and collector views using an authorized test household and existing development facilities.
3. Record actual overflow, hidden actions, footer collisions, and task failures in a short issue list.
4. Confirm which deployed environment phone members will use and how it shares data with desktop ordering.

Deliverable: a bounded defect list and desktop reference screenshots. Do not redesign surfaces that already work.

### 2. Deliver the essential member loop

1. Fix shared navigation, spacing, safe areas, sheets, and form behavior.
2. Complete phone joining and authentication.
3. Adapt Feed, Plan, recipe selection, and meal participation.
4. Adapt personal basket additions and collector desktop handoff.
5. Complete Split inspection and payment reporting.

Deliverable: a non-ordering member can join a household, participate in a weekly plan, add an item, inspect their final share, and report payment without a desktop.

### 3. Complete everyday household use

1. Finish recipe creation/editing and cook mode.
2. Complete leftovers, pantry, dietary preferences, and settings.
3. Verify cutoff, capacity, stale-data, reconnect, and error behavior across devices.
4. Resolve remaining tablet and desktop regressions.

Deliverable: all member tasks listed in this plan are usable on phone with existing business rules intact.

### 4. Add installation and reminders separately

- Consider a manifest, appropriate icons, and installation guidance after the browser experience passes acceptance.
- Scope planning-deadline and payment reminders around existing email work in `docs/email-system-plan.md` before introducing another delivery system.
- If adding push, verify current platform support, permission behavior, subscription storage, scheduling, and delivery monitoring at implementation time.
- Request notification permission in context, after explaining the specific benefit. The app must remain useful when permission is denied.
- Do not cache private household or payment responses indiscriminately. Offline mutations and background ordering are outside this plan.

Deliverable: an optional convenience layer. Installation and push are not prerequisites for the first phone release.

## Validation and release acceptance

Test representative widths of 320, 390, 430, 768, 1024, and 1440 CSS pixels. Include portrait and landscape checks, iOS Safari, and Android Chrome. Browser emulation supports the audit but does not replace a real-phone check of email login, clipboard behavior, keyboard, and safe areas.

The release is ready when:

- A fresh member completes invite-to-first-meal entirely on phone.
- Joining/leaving a meal, adding guests, and adding a personal item persist and appear on desktop without conflicting data.
- Cutoff, full-meal, and server-error states prevent invalid changes and explain the next step.
- A member reads a recipe, records supported cooking actions, and manages leftovers from phone.
- The same split totals and item breakdowns appear on both device sizes.
- Payment reporting respects delivery checks and collector confirmation; retrying cannot create duplicate effects.
- Member screens do not present unusable collector ordering controls. A collector on phone receives accurate desktop handoff guidance.
- Browser back, modal closing, long content, enlarged text, and the keyboard do not trap the user or conceal required actions.
- Navigation and fixed actions do not overlap, and there is no unintended horizontal page scroll.
- Existing desktop planning, basket review, and supported Tesco ordering workflows remain usable.

Extend Playwright coverage for the critical member journey and responsive regressions, reusing the existing authenticated accessibility setup. Use authorized test data for mutations and avoid placing a live Tesco order during automated checks. Run the repository's required `npm run verify` checks after implementation, alongside relevant behavioral tests.

## Out of scope

- A separate native iOS or Android application.
- A separate mobile backend, account system, or set of business rules.
- Moving Tesco browser automation onto phones or solving its hosting constraints.
- A desktop redesign.
- Offline payment reporting, offline plan mutations, or background checkout.
- Changing cost allocation, payment custody, or collector authority.
