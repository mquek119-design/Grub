# Grub Email Architecture & Design System Plan

This document preserves the email design assets, templates, and future architecture roadmap for Grub's email communication system.

---

## 1. Context & Motivation

### Limitations of the Current Default Mailer (Supabase)
1. **Shared Template for Passwordless Auth**: Supabase's `signInWithOtp` uses a single "Magic Link" template for both new sign-ups and returning logins.
2. **Static Subject Line**: Supabase does not support Go template conditional logic in the Subject field. Setting a sign-up subject causes returning users to receive sign-up emails.
3. **Rate Limits & Deliverability**: Supabase's default mailer (`noreply@mail.app.supabase.io`) is strictly rate-limited to 30 emails/hour and frequently lands in spam or promotions tabs.
4. **Limited Branding**: Cannot render dynamic React email components or transactional event emails (e.g. order delivery reconciliation receipts, bill split notifications).

---

## 2. Target Architecture: Custom Email Engine (Resend + React Email)

### Core Components
1. **Sender Domain**: `hello@grubhouse.uk` or `auth@grubhouse.uk` (already verified on Resend with Cloudflare DNS).
2. **Email Component Library**: Built with `@react-email/components` and Tailwind / inline styles matching Grub design tokens.
3. **Delivery Service**: [Resend](https://resend.com) via API client (`resend` npm package).

### Email Types & Triggers

| Type | Recipient | Trigger | Key Content & Tone |
| :--- | :--- | :--- | :--- |
| **Sign-Up Verification** | New User | Form submission on `/onboarding/signup` | "Confirm your Grub account" · Welcome message · Georgia serif branding · 1-click verification button · House setup CTA |
| **Magic-Link Sign-In** | Returning User | Form submission on `/login` | "Sign in to Grub" · Instant access link · Security timestamp · IP/device warning |
| **House Invite** | Invited Housemate | House admin invites a student | "Join Ellesmere Road on Grub" · House name & housemates preview · 1-click join link with invite code |
| **Cutoff Reminder** | House Members | 2 hours before cutoff | "Order cutoff at 5pm" · List of planned meals · Link to add last-minute items |
| **Weekly Delivery Receipt** | House Members | Collector marks delivery arrived | "Your Tesco shop arrived" · Itemised breakdown of what you owe · Revolut / bank transfer payment link |

---

## 3. Visual Design System for Grub Emails

- **Header**: Warm Cream (`#F7F5EF`) to Forest Green (`#1B4332`) gradient bar (6px).
- **Logo**: Double-disc mark (Oat `#D4A574` + Forest `#1B4332` with italic Georgia "g") + Georgia serif "Grub" wordmark.
- **Typography**:
  - Headings: `Georgia, 'Times New Roman', serif`, bold, `#1B4332`.
  - Body: Modern system sans-serif (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`), `#4A463D`, line-height `1.55`.
- **Card**: Rounded corners (20px), subtle `#EBE7DD` border, clean white `#FFFFFF` surface.
- **CTA Button**: Forest Green (`#1B4332`) with warm cream text (`#F7F5EF`), 12px rounded radius, tactile feel.
- **Footer**: "Grub · Plan meals together, buy one shop, split it fairly."

---

## 4. Preserved Supabase Template

The standalone branded HTML template created during the initial setup is saved at:
[`src/lib/email/supabase-template.html`](../src/lib/email/supabase-template.html)

This can be used immediately in Supabase Dashboard (under Authentication → Email Templates) whenever custom SMTP is active.

---

## 5. Implementation Roadmap (When Ready)

1. **Install Dependencies**:
   ```bash
   npm install resend @react-email/components
   ```
2. **Create Email Components**:
   - `src/emails/SignUpEmail.tsx`
   - `src/emails/SignInEmail.tsx`
   - `src/emails/InviteEmail.tsx`
   - `src/emails/WeeklyReceiptEmail.tsx`
3. **Supabase Auth Hook / Custom API**:
   - Configure Supabase Auth "Send Email" hook to call an internal route handler (or Edge Function), passing auth tokens to Resend for 100% custom-designed authentication emails.
