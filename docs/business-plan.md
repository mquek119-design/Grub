# Grub — Strategic Business Plan & Product Roadmap

## 1. Executive Summary & Value Proposition
Grub is a shared grocery planning and communal cooking platform purpose-built for student households and flatshares in the UK. By centralizing weekly meal picking, automated recipe scaling, split calculation, Tesco basket sync, and leftovers management, Grub saves student flats £25–£40/week per person while eliminating the friction of "who's cooking", "who's paying", and "who's cleaning".

---

## 2. University of Warwick Launch Strategy & Student Verification

### 2.1 The Warwick Pilot Context
- **Target Audience**: 28,000+ students across campus halls (Rootes, Tocil, Bluebell, Cryfield, Westwood) and off-campus student flats in Leamington Spa, Coventry, and Canley.
- **Campus Anchor Stores**: Tesco Cannon Park Superstore (on-campus hub) and Tesco Leamington Spa Superstore.

### 2.2 Verification Architecture: Why Not Hard-Locking?
- **The Mixed Flat Trap**: Off-campus flats often have flatmates from Coventry University, apprentices, placement students, or non-student partners. Hard-locking the entire app to `@warwick.ac.uk` prevents the entire flat from using Grub.
- **The Recommended Model: "Warwick-Led Houses" & "Student Badging"**:
  1. Require `@warwick.ac.uk` to **create** a new house or access Warwick-exclusive perks.
  2. Allow housemates with any email (personal Gmail, Outlook, iCloud) to **join** via the 6-character house invite code.
  3. Provide an in-app **"Verify Student Status"** badge for any user with an active university email.

### 2.3 Authentication: Magic Sign-In Links
- **Student Reality**: Warwick SSO with Microsoft Authenticator / Duo 2FA is widely disliked by students due to constant number-matching prompts and session timeouts.
- **Adopted Auth Strategy**: **1-Tap Magic Sign-In Links**:
  1. Student enters their email (personal or `@warwick.ac.uk`).
  2. Supabase sends a direct 1-tap sign-in link (`emailRedirectTo: /auth/callback`).
  3. Student taps the link in their mobile email app (with quick "Open Gmail" / "Open Outlook" buttons in Grub) and lands directly in their flat.
  4. **Status Note**: 6-digit email OTP verification is currently disabled/not working with the default Supabase shared mailer (which only delivers token-hash URLs). 6-digit OTP is deferred until custom SMTP (Resend) is configured. Magic links are the active, reliable sign-in mechanism.
  5. **Persistent 90-Day Mobile Sessions**: Once logged in on phone, session persists for 90 days so students rarely need to re-authenticate.

---

## 3. Warwick Student Perks Roadmap (Future Value Drivers)

### Phase 1: Campus-Specific Intelligence
- **Cannon Park & Leamington Delivery Presets**: Pre-configured delivery postcodes and click-and-collect store mappings for Warwick student hubs.
- **"Rootes Kitchen" Recipe Catalog**: Budget-conscious meals optimized for student halls (2-hob setups, limited oven space, 20-minute cook times, < £1.20/portion).

### Phase 2: Commercial & Local Partnerships
- **Local Butcher & Market Collective**: Partner with Leamington / Coventry local independent grocers or Warwick SU Food Co-op for bulk student discounts on meat, vegetables, and pantry staples.
- **Warwick SU Societies Integration**:
  - Collaboration with Warwick Cooking Society and sports clubs for society meal-prep packs.
  - Inter-flat leaderboards: *"Lowest Cost Per Meal"*, *"Zero Waste Household"* campus badges.

### Phase 3: Financial & Household Benefits
- **House Buffer / Settlement Trust**: Verified Warwick students unlock flexible settlement thresholds (e.g. grace periods before payment nudges).
- **Graduation Transition Pack**: Move housemates seamlessly from student flats to graduate flatshares in London/Birmingham.

---

## 4. Multi-Channel Cutoff Notification System

Because Grub is a high-performance Web App (PWA), notifications must be accessible across multiple channels with granular student choice and opt-outs.

### 4.1 The 3 Notification Channels

```
                           Notification System
                                    │
       ┌────────────────────────────┼────────────────────────────┐
       ▼                            ▼                            ▼
1-Tap WhatsApp Nudge        Web Push (Lock Screen)      Webcal / iCal Sync
- Zero cost                 - Native mobile push        - Native calendar alarms
- 99% open rate             - PWA / iOS 16.4+ / Android - Google, Apple, Outlook
- Shared to flat group chat - Opt-in with toggles       - Auto-updating feed
```

#### Channel 1: 1-Tap "Nudge Flat" on WhatsApp
- **Interaction**: A prominent button on the Feed and Plan pages next to the Countdown timer (`⏰ 2h left until cutoff`).
- **Mechanism**: Invokes Web Share API or `whatsapp://send?text=...` with pre-formatted flat copy:
  > *"🛒 Hey flat! Grub cutoff for this week's Tesco shop is at 8:00 PM (2h left). Lock in your dinners and add your staples: https://grub.app/plan"*
- **Why this beats a cold bot**:
  - Sent by an actual flatmate directly into their existing WhatsApp flat group.
  - Zero API cost, zero phone number management, zero risk of WhatsApp business account spam bans.
- **Future Automated Bot Option**: For houses that want automated group messages, offer an optional Discord webhook or WhatsApp Cloud API bot integration.

#### Channel 2: Web Push Notifications (Lock Screen)
- **Mechanism**: W3C Push API + Service Worker with VAPID authentication.
- **Platform Support**: Works on Android Chrome and iOS 16.4+ (when saved to Home Screen via PWA).
- **Trigger**: Automated serverless cron job 2 hours and 30 minutes before `cutoff_at`.
- **User Controls**:
  - Toggle in `Settings -> Notifications`.
  - Granular alerts: [ ] Cutoff warnings, [ ] Cook tonight alerts, [ ] Delivery arrival window.

#### Channel 3: Webcal / iCal Calendar Feed
- **Mechanism**: Personal `.ics` feed endpoint (`webcal://grub.app/api/calendar/[user-token].ics`).
- **Compatibility**: 1-click subscription into Google Calendar, Apple Calendar, and Outlook.
- **Events Included**:
  - Weekly basket cutoff deadline (with 1-hour alarm).
  - Cook duty & wash-up duty (with link to `/recipes/[id]?cook=true`).
  - Tesco delivery / collection window.
- **Auto-Sync**: Calendars refresh in the background automatically as the plan updates.

---

## 5. User Preferences & Opt-Out Matrix

In `Settings -> Notifications & Integrations`, each student can customize their notification surface:

| Feature | Default | User Options |
| :--- | :--- | :--- |
| **Cutoff Reminder (Web Push)** | Off (prompts on 1st visit) | Off / 2 hours prior / 30 mins prior |
| **Cook Duty Reminder (Web Push)** | On | On / Off / 1h before dinner |
| **Calendar Sync (Webcal)** | On demand | [Subscribe to Calendar] link |
| **WhatsApp Nudge** | Enabled | 1-Tap share button visible to all housemates |
| **Email Digest** | On | Sunday 4:00 PM summary / Opt-out |

---

## 6. Brand Identity & Official Mascot: Stocky the Bouillon Cube

### 6.1 The Core Insight: One Ingredient, Multiplied
- **The Product Truth**: One stock cube (or one bag of onions, one pack of mince, one block of cheese) stretching across multiple communal meals is literally what Grub’s grocery optimiser accomplishes.
- **Why Stocky Resonates**:
  1. **Subconscious Value Reinforcement**: Every time Stocky appears, it reinforces the core thesis: *"Grub makes one ingredient do more work"* without preaching in sales copy.
  2. **Student Cupboard Hero**: Stock cubes are the indispensable workhorse of British student kitchens. Cheap, compact, and dissolving into everything from bolognese to lentil dahl.
  3. **Rich Expressive Range Tied to Real UX Moments**:
     - **Stressed Stocky** (*sweat drop, alarmed eyes, wavy mouth*): Cutoff in <2 hours, missing flatmate selections, or empty pantry alert.
     - **Smug Stocky** (*winking, thumbs up, foil shine sparkle*): Weekly budget goal beat (£18/person/week), all 5 housemates confirmed, or Tesco Clubcard discount applied.
     - **Asleep Stocky** (*curved eyes, floating 'z Z'*): Sunday late night post-delivery quiet hours; nothing left to coordinate.
     - **Chef Stocky** (*mini chef toque, wooden spoon*): In Kitchen Counter Cook Mode, cheering on the designated cook.
     - **Split Stocky** (*holding golden £ coin / receipt ribbon*): Bridges the culinary side with fair debt settlement ("Paid down to the penny!").

### 6.2 Campus Touchpoint & Viral Sticker Strategy
- **Metallic Foil Die-Cut Stickers**: High-appeal stickers mimicking foil-wrapped bouillon cubes handed out during Warwick Freshers' Week and Cannon Park flyering. High pickup rate for student laptops, drink flasks, and kitchen whiteboards.
- **Micro-Interaction Moments**: Vector-rendered inside the web app for instant 0ms load times, subtle hover animations, and emotional feedback during cutoff count-downs, basket sync, and recipe steps.

---

## 7. Future Spin-off: Grub Studio / Solo Meal Prep & Macro Budgeting (Post-Launch Expansion)

> [!NOTE]
> **Product Boundary & Roadmap Priority**: Grub's active product focus is 100% on **shared student households and flatshares**. Grub Studio is a planned future spin-off product for students living in single studios and postgraduates living alone, rather than an in-app toggle inside the household product. It is cataloged here for long-term vision and investor context.

### 7.1 The Pivot from "Shared Flat" to "Studio / Solo Spin-off"
While Grub was born to solve the social and financial chaos of shared student kitchens, the underlying mathematical engine — **cross-meal ingredient combination and pack-level supermarket cart optimization** — solves an equally massive problem for individual students and young professionals living in private studios or cooking purely for themselves.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                SAME ENGINE, DUAL LENS                                  │
├─────────────────────────────────────────┬──────────────────────────────────────────────┤
│            GRUB HOUSEHOLD               │                  GRUB SOLO                   │
├─────────────────────────────────────────┼──────────────────────────────────────────────┤
│ Splitting ingredients across PEOPLE     │ Splitting ingredients across DAYS (Meal Prep)│
│ "5 housemates sharing 1kg chicken"      │ "1 person batching 1kg chicken across 4 days"│
│ Bill splitting & debt settlement        │ Macro budgeting (£ per 100g protein)         │
│ Shared kitchen cook rotas               │ Sunday batch prep & freezer storage schedule │
│ Eliminates social cooking friction      │ Eliminates solo food waste & takeaway drift  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 The Solo Cooking Trap: The "Pack-Size Curse"
1. **Supermarkets are Built for Families**: Retail packaging (500g mince, 1kg carrots, 300ml cream, bags of spinach) makes cooking for one person extraordinarily wasteful. Single shoppers either:
   - Overbuy and watch £10–£15 of fresh greens rot into brown sludge in the crisper drawer by Thursday, or
   - Give up and spend £8–£12/night on Deliveroo or ready-meals.
2. **The Solo Meal Prep Solution**: Grub Solo schedules recipes that **exhaust whole supermarket packs across 3–4 days**. If a Thai Curry calls for 200ml coconut milk and half a bag of coriander on Monday, Tuesday’s Stir Fry automatically absorbs the remainder. Zero food waste, minimum spend.

---

### 7.3 Macro Budgeting: The "Protein-per-Pence" Engine
Fitness and gym culture is ubiquitous among university students, but existing solutions are siloed:
- **MyFitnessPal / MacroFactor**: Track calories and macros *after* you have already bought and eaten them, with zero knowledge of price or supermarket availability.
- **Supermarket Apps (Tesco, Sainsbury's)**: Price groceries with zero awareness of nutritional macro composition.

**Grub bridges this gap with Macro Budgeting:**

#### A. Dual-Constraint Knapsack Solver
Users input both their **Financial Budget** and their **Macro Target**:
> *"Hit 150g protein/day & 2,300 kcal/day on a strict £28 weekly grocery budget."*

#### B. The "Protein Efficiency Index" (£/100g Protein)
Grub’s supermarket pricing engine indexes every Tesco product by protein cost-efficiency:
* **High Efficiency**: Eggs (£0.95/100g protein), Greek Style Yoghurt (£1.10/100g protein), Canned Tuna (£1.35/100g protein), Own-brand Chicken Breast (£1.65/100g protein), Red Lentils (£0.60/100g protein).
* **Low Efficiency**: Branded protein bars (£6.50/100g protein), pre-made protein shakes (£5.80/100g protein), premium steak fillets (£7.20/100g protein).

#### C. Smart Macro Swaps in the Basket
If a user is 25g short of their weekly protein target or £3 over budget, Grub suggests high-yield substitutions directly in the cart:
> *"💡 Swap brand granola for 0% Greek Yoghurt + frozen berries: Saves £1.80 and adds +32g protein to your week."*

---

### 7.4 Solo Meal Prep Workflow & Product Features

1. **The "Sunday Batch Prep" Session**:
   - Cook Mode adapts to **batch cooking**: instead of cooking for 1 sitting, it guides the student to cook 4–6 portions at once in 45 minutes.
   - **Container Divvy Guidance**: Clear visual prompts for storage:
     - *Container 1 & 2* &rarr; Fridge (Eaten Monday & Tuesday).
     - *Container 3 & 4* &rarr; Freezer (Eaten Thursday & Friday).
2. **Smart Freezer & Defrost Alerts (Calendar Integration)**:
   - Automatically schedules 1-tap alarms into Apple/Google Calendar:
     > *"🧊 Grub Defrost Alert: Move Tupperware #3 from freezer to fridge tonight so it’s ready for tomorrow’s lunch."*
3. **Macro Progress Strip**:
   - The weekly plan dashboard displays daily average macro bars:
     `Calories: 2,250 / 2,300 kcal` | `Protein: 152g / 150g` | `Cost: £3.85 / day`

---

### 7.5 Strategic Business & Market Impact

1. **Massive TAM Expansion**:
   - Unlocks students in studio apartments, postgraduates, individual hall residents without a communal cooking circle, and young professionals living alone in major cities.
2. **Zero-Churn Graduation Flywheel**:
   - When a student graduates from a shared house at Warwick and moves into a 1-bed flat in London or Manchester, they do not churn. They toggle their account from **"Household Mode"** to **"Solo Meal Prep Mode"**, keeping their recipes, meal history, and grocery habits intact.
3. **High-Margin Monetization (Grub Pro)**:
   - **Household Grub (Free)**: Core communal meal planning, split settlement, basic supermarket sync.
   - **Grub Pro / Fitness Tier (£3.99/mo or £32/yr)**:
     - Automated Macro Budgeting & Goal Optimizer.
     - 1-Click sync to Apple Health & MyFitnessPal.
     - Custom high-protein / low-carb batch prep catalog.
     - Bulk prep freezer scheduler with calendar defrost reminders.

