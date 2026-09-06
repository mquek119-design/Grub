# Option 7: Accessibility Audit (WCAG 2.1 AA)

**Objective**: Achieve WCAG 2.1 Level AA compliance across all routes.

**Focus**: Desktop (1440px)  
**Timeline**: 1-2 days with parallel agents  
**Agents**: 2-3 concurrent

---

## Areas to Check

### 1. Keyboard Navigation
- [ ] Tab through all pages (logical tab order)
- [ ] Escape closes modals/sheets
- [ ] Enter/Space activates buttons
- [ ] Arrow keys in dropdowns/selects
- [ ] Skip-to-content link (if applicable)

Routes to test:
- Feed, Plan, Recipes, Basket, Split, Account, Settings

### 2. Color Contrast Ratios
WCAG AA targets:
- **Normal text**: 4.5:1 (minimum)
- **Large text** (18pt+): 3:1 (minimum)
- **UI components** (buttons, icons): 3:1 (minimum)

Check:
- Text on background colors
- Buttons on surface colors
- Icons against backgrounds
- Input fields and labels
- Links vs surrounding text

### 3. ARIA Labels & Roles
- [ ] Interactive elements have labels
- [ ] Buttons have text or aria-label
- [ ] Icons have title/aria-label
- [ ] Form inputs have associated labels
- [ ] Landmarks use semantic HTML (nav, main, aside)
- [ ] Live regions (alerts, status updates) have aria-live

### 4. Focus Visibility
- [ ] All interactive elements have visible focus ring
- [ ] Focus ring not obscured by other elements
- [ ] Focus order follows visual layout
- [ ] No focus traps (can tab out of all elements)

### 5. Form Accessibility
- [ ] All inputs have associated `<label>` tags
- [ ] Error messages linked to inputs (aria-describedby)
- [ ] Required fields marked (* or aria-required)
- [ ] Form validation messages clear
- [ ] Radio/checkbox groups have fieldset + legend

### 6. Screen Reader Testing
Simulate with:
- NVDA (free Windows screen reader)
- JAWS (paid, but widely used)
- Or axe DevTools (browser extension)

Test:
- Page structure (headings hierarchy: h1→h2→h3)
- Navigation landmarks
- Form labels and instructions
- Button purposes
- Image alt text (if any)
- Tables (if any)

### 7. Reduced Motion Preferences
- [ ] Animations disabled when `prefers-reduced-motion: reduce`
- [ ] Content still accessible without animations
- [ ] No auto-playing videos/animations

Check:
- `src/globals.css` for `@media (prefers-reduced-motion)`
- All keyframes neutralised

### 8. Touch Target Sizes
✅ **Already fixed in Week 1** (44×44px minimum)
- Verify no regressions

---

## Tools

### Automated Testing
- **axe DevTools** (Chrome extension) - WCAG violations scanner
- **WAVE** (WebAIM) - Accessibility auditor
- **Lighthouse** (DevTools → Accessibility tab)

### Manual Testing
- **Keyboard-only navigation** (no mouse)
- **Screen reader simulation** (NVDA on Windows)
- **Zoom to 200%** (resize window, check text readability)

### Color Contrast
- **WebAIM Contrast Checker** - online tool
- Or use browser DevTools color picker

---

## Success Criteria

- [ ] Zero axe violations on all pages
- [ ] Color contrast ≥ 4.5:1 for normal text
- [ ] All interactive elements keyboard accessible
- [ ] Keyboard-only navigation flows work
- [ ] Visible focus ring on all interactive elements
- [ ] All form inputs have labels
- [ ] Animations respect prefers-reduced-motion
- [ ] Touch targets ≥ 44×44px (verified)
- [ ] Screen reader testing passes (all text readable)
- [ ] No focus traps

---

## Parallel Execution

**Agent A: Automated Scanning & Contrast** (1-2h)
- Run axe DevTools on all routes
- Check color contrast ratios
- Identify WCAG violations
- Screenshot issues found

**Agent B: Keyboard & Screen Reader Testing** (1-2h)
- Test keyboard navigation on all routes
- Verify focus ring visibility
- Simulate screen reader experience
- Check form accessibility

**Agent C: Code Audit for ARIA/Labels** (1h)
- Scan for missing aria-labels
- Verify semantic HTML usage
- Check form label associations
- Verify landmark structure

---

## Definition of Done

- [ ] Zero critical/high-severity axe violations
- [ ] All color contrast ratios meet WCAG AA
- [ ] Keyboard navigation works on all routes
- [ ] Focus ring visible on all interactive elements
- [ ] All forms properly labeled
- [ ] Animations respect prefers-reduced-motion
- [ ] Comprehensive accessibility report generated
- [ ] Recommendations documented
- [ ] Action items prioritized

---

## Common Issues to Watch For

- Missing alt text on images (though FoodImage/Avatar components handle this)
- Unlabeled buttons (should have text or aria-label)
- Insufficient color contrast on secondary text
- Focus traps in modals/dropdowns
- Form errors not linked to inputs
- Missing ARIA labels on icons
- Animations not respecting reduced motion preference

---

## WCAG 2.1 Level AA Target

- **A** (minimum): All sites should meet this
- **AA** (intermediate): Standard for accessible web
- **AAA** (enhanced): Not required, but recommended for public services

HouseGrocer targets **AA** compliance.

