# Grub Email & Authentication Guide

This document covers both the current Supabase email/authentication setup and the future architecture plan for custom Grub-branded transactional emails (Resend + React Email).

---

## Part 1 — Current Supabase Email Configuration

> [!IMPORTANT]
> **Current Sign-In Status: Reverted to Magic Links (6-Digit OTP Still Not Working for Email)**
> 6-digit numeric OTP codes sent via email do not currently verify reliably against Supabase Auth (`verifyOtp` fails/rejects with default templates). The default Supabase mailer is strictly configured to deliver magic link URLs (`{{ .ConfirmationURL }}`) rather than numeric tokens (`{{ .Token }}`).
> Therefore, both `/login` and `/onboarding/signup` have been reverted to use **1-Tap Magic Sign-In Links**.
> Once custom SMTP (via Resend) is connected and Supabase email templates are updated in the Supabase Dashboard to include `{{ .Token }}`, numeric OTP codes can be re-evaluated. Until then, magic links remain the active sign-in flow.

Grub uses passwordless email authentication with magic links. To ensure emails are branded, reliable, and distinguish sign-up from sign-in:

### 1. Update the Email Template in Supabase Dashboard
1. Open your **[Supabase Dashboard](https://supabase.com/dashboard)**.
2. Select your project.
3. Go to **Authentication** &rarr; **Email Templates**.
4. Click on the **Magic Link** template (used for passwordless sign-up and sign-in).
5. Set the **Subject** line to:
   ```text
   {{ if eq .Data.flow "signup" }}Confirm your Grub account{{ else }}Sign in to Grub{{ end }}
   ```
6. Replace the **Message Body (HTML)** with the contents of:
   [`src/lib/email/supabase-template.html`](../src/lib/email/supabase-template.html)
7. Click **Save Changes**.
8. *(Optional)* Paste the same template into the **Confirm signup** tab with the subject `Confirm your Grub account`.

### 2. Configure Redirect URLs (Critical for Authentication)
In Supabase Dashboard &rarr; **Authentication** &rarr; **URL Configuration**:
- **Site URL**:
  - Production: `https://grub-lime.vercel.app` (or `https://grubhouse.uk`)
  - Local Testing: `http://localhost:3002`
- **Redirect URLs** (add all of the following):
  - `http://localhost:3002/**`
  - `http://localhost:3000/**`
  - `https://grub-lime.vercel.app/**`
  - `https://grubhouse.uk/**`
  - `https://*.vercel.app/**` (allows preview deployments to work)

### 3. How Authentication Works in the Codebase
1. **Flow distinction**:
   - `SignupForm` sends `data: { flow: 'signup' }` &rarr; email reads "Confirm your Grub account" and "Confirm my account".
   - `LoginForm` sends `data: { flow: 'login' }` &rarr; email reads "Sign in to Grub".
2. **Cross-device resilience**:
   - `/auth/callback` and `/auth/confirm` handle PKCE codes, token hashes, and error redirects.
   - If an email app blocks link redirects, users can copy the **6-digit code** directly into Grub's verification screen.
3. **Custom SMTP**:
   - Supabase's default shared mailer is rate-limited to 30 emails/hour.
   - For production, go to **Project Settings** &rarr; **Authentication** &rarr; **SMTP Settings** and connect [Resend](https://resend.com) (`smtp.resend.com`, sender `@grubhouse.uk`).

---

## Part 2 — Future Architecture Plan (Resend + React Email)

When ready to graduate from Supabase's single template to a full custom transactional email suite:

### Target Components
1. **Sender Domain**: `hello@grubhouse.uk` or `auth@grubhouse.uk` (verified on Resend via Cloudflare DNS).
2. **Component Library**: `@react-email/components` styled with Grub design tokens.
3. **Delivery Client**: [Resend](https://resend.com) SDK (`resend` npm package).

### Email Types & Triggers

| Type | Recipient | Trigger | Key Content & Tone |
| :--- | :--- | :--- | :--- |
| **Sign-Up Verification** | New User | Form submission on `/onboarding/signup` | "Confirm your Grub account" · Welcome message · Georgia serif branding · 1-click verification button · House setup CTA |
| **Magic-Link Sign-In** | Returning User | Form submission on `/login` | "Sign in to Grub" · Instant access link · Security timestamp · IP/device warning |
| **House Invite** | Invited Housemate | House admin invites a student | "Join Ellesmere Road on Grub" · House name & housemates preview · 1-click join link with invite code |
| **Cutoff Reminder** | House Members | 2 hours before cutoff | "Order cutoff at 5pm" · List of planned meals · Link to add last-minute items |
| **Weekly Delivery Receipt** | House Members | Collector marks delivery arrived | "Your Tesco shop arrived" · Itemised breakdown of what you owe · Revolut / bank transfer payment link |

### Visual Design System for Emails
- **Header**: Warm Cream (`#F7F5EF`) to Forest Green (`#1B4332`) gradient bar (6px).
- **Logo**: Double-disc mark (Oat `#D4A574` + Forest `#1B4332` with Georgia "g") + Georgia serif "Grub" wordmark.
- **Typography**:
  - Headings: `Georgia, 'Times New Roman', serif`, bold, `#1B4332`.
  - Body: Modern system sans-serif (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`), `#4A463D`, line-height `1.55`.
- **Card**: Rounded corners (20px), `#EBE7DD` border, clean white `#FFFFFF` surface.
- **CTA Button**: Forest Green (`#1B4332`) with warm cream text (`#F7F5EF`), 12px rounded radius, tactile feel.
- **Footer**: "Grub · Plan meals together, buy one shop, split it fairly."

### Implementation Steps (When Scheduled)
```bash
npm install resend @react-email/components
```
1. Create templates under `src/emails/` (`SignUpEmail.tsx`, `SignInEmail.tsx`, `InviteEmail.tsx`, `ReceiptEmail.tsx`).
2. Hook Supabase Auth "Send Email" hook or custom Next.js API route handlers to dispatch via Resend.
