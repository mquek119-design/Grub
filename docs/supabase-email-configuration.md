# Supabase Email & Authentication Configuration Guide

This guide ensures Grub's emails look branded, distinguish sign-up from sign-in, and authenticate reliably across mobile and desktop.

---

## 1. Update the Email Template in Supabase Dashboard

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

*(Optional)* You can also paste the same template into the **Confirm signup** tab with the subject `Confirm your Grub account`.

---

## 2. Configure Redirect URLs (Critical for Authentication)

If your redirect URLs are not listed in Supabase, email authentication will fail or redirect to the wrong port.

1. In Supabase Dashboard, go to **Authentication** &rarr; **URL Configuration**.
2. **Site URL**:
   - For Production: `https://grub-lime.vercel.app` (or your custom domain)
   - For Local Testing: `http://localhost:3002`
3. **Redirect URLs** (Add all of the following to allow verification across environments):
   - `http://localhost:3002/**`
   - `http://localhost:3000/**`
   - `https://grub-lime.vercel.app/**`
   - `https://*.vercel.app/**` (allows preview deployments to work)
4. Click **Save**.

---

## 3. How Authentication Now Works in Grub

1. **Sign-up vs Sign-in distinction**:
   - `SignupForm` sends `data: { flow: 'signup' }`. The email automatically says **"Confirm your Grub account"** and **"Confirm my account"**.
   - `LoginForm` sends `data: { flow: 'login' }`. The email says **"Sign in to Grub"**.

2. **Cross-device & Email scanner resilience**:
   - Both `/auth/callback` and `/auth/confirm` now handle:
     - `code` (standard PKCE exchange)
     - `token_hash` + `type` (cross-device safe OTP verification)
     - Supabase error parameters with descriptive feedback
   - If an email app blocks redirects or PKCE cookies are missing on mobile, users can also simply copy the **6-digit code** directly into Grub's on-screen verification box!

3. **Custom SMTP (Recommended for Production)**:
   - Supabase has a default rate limit of 30 emails per hour on their shared mailer.
   - For production, go to **Project Settings** &rarr; **Authentication** &rarr; **SMTP Settings** and connect [Resend](https://resend.com) (free 3,000 emails/mo) or SendGrid so emails are sent from `noreply@yourdomain.com` with instant delivery.
