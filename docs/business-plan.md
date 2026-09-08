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

### 2.3 Authentication: 6-Digit Email OTP & Magic Link
- **Student Reality**: Warwick SSO with Microsoft Authenticator / Duo 2FA is widely disliked by students due to constant number-matching prompts and session timeouts.
- **Adopted Auth Strategy**: **6-Digit Numeric Email OTP / Magic Link**:
  1. Student enters their email (personal or `@warwick.ac.uk`).
  2. Supabase sends a 6-digit numeric OTP code (`Your Grub code: 742 819`) alongside a magic link.
  3. **Why 6-digit OTP solves university spam filters**: Automated university security scanners crawl links, not numeric codes. The student simply glances at the notification banner or email preview and inputs the 6 numbers.
  4. **Persistent 90-Day Mobile Sessions**: Once logged in on phone, session persists for 90 days with biometric (Face ID / Touch ID) re-entry so students rarely need to re-authenticate.

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
