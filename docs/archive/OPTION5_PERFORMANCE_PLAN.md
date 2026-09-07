# Option 5: Performance & Load Testing

**Objective**: Optimize before scaling. Measure and fix performance bottlenecks.

**Focus**: Desktop (1440px)  
**Timeline**: 2-3 days with parallel agents  
**Agents**: 2-3 concurrent

---

## Metrics to Check

### 1. Page Load Performance (Lighthouse)
- **FCP** (First Contentful Paint): < 2s target
- **LCP** (Largest Contentful Paint): < 3s target  
- **CLS** (Cumulative Layout Shift): < 0.1 target
- **Performance Score**: > 80

Routes to test:
- Feed (`/`)
- Plan (`/plan`)
- Recipes (`/recipes`)
- Basket (`/basket`)
- Split (`/split`)

### 2. Server Action Response Time
- Measure p95, p99 latency
- Target: p95 < 500ms
- Actions to test:
  - `addMealToPlan`
  - `createRecipe`
  - `postSplit`
  - `updateItemReceived`
  - `sendMagicLink`

### 3. Database Query Count (N+1 Detection)
Per route, count queries:
- Feed: Should be ~10-15 queries (not 50+)
- Plan: Should be ~20-30 (not 100+)
- Basket: Should be ~10-15
- Split: Should be ~15-20

Use React DevTools Profiler to measure query count.

### 4. Bundle Size Analysis
- Total JS: Target < 150KB (gzipped)
- Per-route: No route > 50KB
- Check for dead code, duplicates, large dependencies

### 5. Image Optimization
- Tesco product images: lazy-loading enabled?
- Avatar images: using `<FoodImage>` / `<Avatar>` components?
- No unoptimized `<img>` tags?

### 6. Memory Usage
- Monitor React DevTools Profiler
- Check for memory leaks on route transitions
- Look for unreleased components/subscriptions

---

## Known Optimizations Needed (from CLAUDE.md)

- [ ] Remove Map recreation on every render (Map created fresh each render)
- [ ] Batch database queries (prevent waterfall)
- [ ] Memoization on expensive components
- [ ] Code-split heavy routes (recipes, reconciliation)
- [ ] Image lazy-loading (Tesco products)

---

## Testing Approach

### Lighthouse Tests
1. Run Lighthouse on each main route (localhost:3002)
2. Use DevTools → Lighthouse tab
3. Target: Desktop, Throttle: No Throttle (measure local performance)
4. Record FCP, LCP, CLS, Performance Score

### Query Count Profiling
1. Open React DevTools → Profiler tab
2. Navigate to route
3. Record query count by monitoring network tab
4. Check for N+1 patterns (e.g., loop fetching individual items)

### Bundle Analysis
1. Run: `npm run build`
2. Analyze `.next` output directory
3. Check Next.js bundle analyzer output (if available)
4. Look for large dependencies in `node_modules`

### Server Action Timing
1. Add timing logs to server actions
2. Or use Network tab to measure response time
3. Run actions multiple times, record p95/p99

---

## Success Criteria

- [ ] FCP < 2s on all main routes
- [ ] LCP < 3s on all routes
- [ ] CLS < 0.1 on all routes
- [ ] Server action p95 < 500ms
- [ ] No N+1 queries found
- [ ] Bundle size < 150KB gzipped
- [ ] All images lazy-loaded
- [ ] No memory leaks detected
- [ ] Performance report generated with recommendations

---

## Parallel Execution

**Agent A: Lighthouse & Performance Metrics** (1-2h)
- Run Lighthouse on all main routes
- Measure FCP, LCP, CLS, Performance scores
- Document baseline metrics
- Identify bottlenecks

**Agent B: Database Queries & Bundle Analysis** (1-2h)
- Profile query count per route
- Detect N+1 patterns
- Analyze bundle size
- Identify optimization opportunities

**Agent C: Server Actions & Memory** (1h)
- Measure server action response times
- Profile memory usage
- Check for memory leaks
- Verify image optimization

---

## Definition of Done

- [ ] Lighthouse metrics collected for all routes
- [ ] Query profiling completed (N+1 detection)
- [ ] Bundle size analyzed
- [ ] Server action timing measured
- [ ] Memory profiling checked
- [ ] Optimization recommendations documented
- [ ] Performance report generated
- [ ] Actionable fixes identified (priority order)

