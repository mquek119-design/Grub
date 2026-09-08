# Grub Mockups & Design System Specification

This directory holds the Google Stitch screen generation prompts and the design token specifications for Grub.

---

## 1. Google Stitch Prompt Guide

Paste the **System prompt** once, then one **Screen prompt** per screen. Stitch does best with one screen per generation.

Tokens match live values from `tailwind.config.ts`.

### System Prompt (prepend to every screen)

> Design a mobile-first web app called **Grub**. It helps UK university housemates plan meals together, build one shared Tesco order, and split the cost per item rather than equally. The tone is calm, plain-spoken and a bit dry — students, not a wellness brand. Never cute, never corporate.
>
> **Palette — use these hex values exactly.**
> - Background: `#FAFAF7` (warm off-white, the page ground)
> - Primary: `#1B4332` (deep forest green) with white text
> - Primary container: `#2D6A4F`, on-primary-container `#D8F3DC`
> - Primary fixed (tints, chips): `#D8F3DC`
> - Secondary / accent: `#D4A574` (warm tan) with `#1B4332` text
> - Secondary fixed (soft highlight blocks): `#FDECD0`
> - Cards: white `#FFFFFF`, 1px border `#E5E5E0`, soft ambient shadow
> - Error: reserved for destructive actions only, never for plan states
>
> **Type.** Plus Jakarta Sans for all text. JetBrains Mono for every number — money, quantities, dates, countdowns — so columns of figures align.
>
> **Shape.** Corner radius 4px default, 8px medium, 12px on cards. Pill/full radius on buttons and filter chips. 375px viewport, 16px gutters, comfortable tap targets (44px minimum).
>
> **Rules that matter.**
> - Money is only ever shown when it is real. Never render a placeholder price, never show `£0.00` for something unpriced — write "No price" instead.
> - Nothing in the UI blocks or scolds a user's choice. Suggestions are offers.
> - No red for a normal state. Red is for deleting things.
> - Use Material Symbols icons, outlined weight.

---

## 2. Screen Specifications

### Screen 1 — Plan (Your Week)
- Mobile-first view showing one week of meals.
- Header: "Your Week", sub-line "Add meals and join your housemates' by Sunday 5:00 pm".
- Content: Horizontally scrolling row of day cards (Monday to Sunday).
- Inside day card: Vertically stacked meals with food thumbnail, sitting badge (BREAKFAST / LUNCH / DINNER), recipe name, participant avatars, and portion count.

### Screen 2 — Recipes (Household Recipe Book)
- Header with search, dietary filters, and "Add recipe" button.
- Grid of recipe cards: 16:9 photo thumbnail, cook time badge, cost per portion in mono, dietary chips.

### Screen 3 — Basket (Shared Tesco Trolley)
- Collapsible categories (Fresh, Cupboard, Bakery, Frozen, Household).
- Search filter at top.
- Per-line item: Thumbnail, product title, pack size, quantity stepper, brand swap button with savings delta.
- Right-hand summary panel: Estimated total, savings badge, minimum order progress, and slot selector.

### Screen 4 — Split (Settle Up)
- Summary card: Total spent, your balance (owes / is owed).
- Itemised workings per housemate with exact penny arithmetic.
- Collector bank transfer & Revolut copyable details.

---

## 3. Core Color Tokens

```yaml
colors:
  surface: '#FAFAF7'
  surface-dim: '#DADADC'
  surface-bright: '#FFFFFF'
  surface-container-low: '#F3F3F6'
  surface-container: '#EEEEEF'
  surface-container-high: '#E8E8EA'
  on-surface: '#1A1C1E'
  on-surface-variant: '#3E4A41'
  primary: '#1B4332'
  primary-container: '#2D6A4F'
  on-primary-container: '#D8F3DC'
  secondary: '#D4A574'
  secondary-container: '#FDECD0'
  on-secondary-container: '#1B4332'
  outline: '#6E7A70'
  outline-variant: '#E5E5E0'
  error: '#BA1A1A'
```
