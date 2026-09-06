import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3002';
const ROUTES = [
  { name: 'Feed', path: '/' },
  { name: 'Plan', path: '/plan' },
  { name: 'Recipes', path: '/recipes' },
  { name: 'Basket', path: '/basket' },
  { name: 'Split', path: '/split' },
];

async function auditRoute(url) {
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
    });

    const page = await context.newPage();

    // Collect performance metrics
    const metrics = {};
    const networkMetrics = { requestCount: 0, bytesReceived: 0 };

    // Track network requests
    page.on('response', (response) => {
      networkMetrics.requestCount++;
    });

    // Navigate and measure
    const startTime = Date.now();

    await page.goto(url, { waitUntil: 'networkidle' });

    const navigationTiming = await page.evaluate(() => {
      const timing = window.performance.getEntriesByType('navigation')[0];
      const paintEntries = window.performance.getEntriesByType('paint');
      const longtaskEntries = window.performance.getEntriesByType('longtask');

      // Collect Layout Shift data
      const layoutShifts = window.performance.getEntriesByType('layout-shift');
      let cls = 0;
      layoutShifts.forEach(shift => {
        if (!shift.hadRecentInput) {
          cls += shift.value;
        }
      });

      // Find largest contentful paint
      const lcpEntries = window.performance.getEntriesByType('largest-contentful-paint');
      const lcp = lcpEntries.length > 0 ? lcpEntries[lcpEntries.length - 1].renderTime || lcpEntries[lcpEntries.length - 1].loadTime : 0;

      // Find first contentful paint
      const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      const fcp = fcpEntry ? fcpEntry.startTime : 0;

      return {
        domContentLoaded: timing?.domContentLoadedEventEnd - timing?.domContentLoadedEventStart,
        loadComplete: timing?.loadEventEnd - timing?.loadEventStart,
        firstPaint: paintEntries.find(e => e.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: fcp,
        largestContentfulPaint: lcp,
        cumulativeLayoutShift: cls,
        timeToFirstByte: timing?.responseStart - timing?.requestStart || 0,
        domInteractive: timing?.domInteractive - timing?.fetchStart || 0,
      };
    });

    await context.close();
    await browser.close();

    return {
      success: true,
      metrics: navigationTiming,
      network: networkMetrics,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    if (browser) await browser.close();
    return {
      success: false,
      error: error.message,
    };
  }
}

function calculatePerformanceScore(metrics) {
  // Simplified Lighthouse-like scoring
  // Based on Web Vitals and common performance metrics

  let score = 100;

  // FCP penalty (target: 1.8s)
  const fcp = metrics.firstContentfulPaint;
  if (fcp > 1800) score -= Math.min(40, (fcp - 1800) / 50);
  else if (fcp > 1000) score -= Math.min(20, (fcp - 1000) / 50);

  // LCP penalty (target: 2.5s)
  const lcp = metrics.largestContentfulPaint;
  if (lcp > 2500) score -= Math.min(40, (lcp - 2500) / 75);
  else if (lcp > 1500) score -= Math.min(20, (lcp - 1500) / 75);

  // CLS penalty (target: 0.1)
  const cls = metrics.cumulativeLayoutShift;
  if (cls > 0.1) score -= Math.min(40, (cls - 0.1) * 200);
  else if (cls > 0.05) score -= Math.min(20, (cls - 0.05) * 100);

  // TTFB penalty (target: 600ms)
  const ttfb = metrics.timeToFirstByte;
  if (ttfb > 600) score -= Math.min(15, (ttfb - 600) / 100);

  return Math.max(0, Math.round(score));
}

async function main() {
  console.log('Starting Performance Audits at 1440px Desktop (No Throttle)...\n');

  const results = [];

  for (const route of ROUTES) {
    const url = BASE_URL + route.path;
    console.log(`Auditing ${route.name} (${url})...`);

    const result = await auditRoute(url);

    if (result.success) {
      const metrics = result.metrics;
      const score = calculatePerformanceScore(metrics);

      results.push({
        route: route.name,
        path: route.path,
        metrics: {
          fcp: (metrics.firstContentfulPaint / 1000).toFixed(2),
          lcp: (metrics.largestContentfulPaint / 1000).toFixed(2),
          cls: metrics.cumulativeLayoutShift.toFixed(3),
          performanceScore: score,
          ttfb: (metrics.timeToFirstByte / 1000).toFixed(3),
          dcl: (metrics.domContentLoaded / 1000).toFixed(2),
          loadComplete: (metrics.loadComplete / 1000).toFixed(2),
        },
        duration: result.duration,
      });

      console.log(
        `  ✓ Complete: FCP ${metrics.firstContentfulPaint.toFixed(0)}ms | LCP ${metrics.largestContentfulPaint.toFixed(0)}ms | Score ${score}/100`
      );
    } else {
      console.error(`  ✗ Error: ${result.error}`);
      results.push({
        route: route.name,
        path: route.path,
        error: result.error,
      });
    }
  }

  // Output results
  console.log('\n' + '='.repeat(110));
  console.log('PERFORMANCE AUDIT RESULTS - 1440px Desktop (No Throttle)\n');

  // Metrics table
  console.log('PERFORMANCE METRICS:');
  console.log('-'.repeat(110));
  console.log('Route       | FCP (s) | LCP (s) | CLS    | Score | TTFB (s) | DCL (s) | Load (s) | Status');
  console.log('-'.repeat(110));

  results.forEach(result => {
    if (!result.error) {
      const { metrics } = result;
      const fcp = parseFloat(metrics.fcp);
      const lcp = parseFloat(metrics.lcp);
      const cls = parseFloat(metrics.cls);
      const score = metrics.performanceScore;

      const fcpOk = fcp < 2 ? '✓' : '✗';
      const lcpOk = lcp < 3 ? '✓' : '✗';
      const clsOk = cls < 0.1 ? '✓' : '✗';
      const scoreOk = score > 80 ? '✓' : '✗';

      const status = fcpOk === '✓' && lcpOk === '✓' && clsOk === '✓' && scoreOk === '✓' ? 'PASS' : 'NEEDS WORK';

      console.log(
        `${result.route.padEnd(11)}| ${metrics.fcp.padStart(7)} | ${metrics.lcp.padStart(7)} | ${metrics.cls.padStart(6)} | ${score.toString().padStart(5)} | ${metrics.ttfb.padStart(8)} | ${metrics.dcl.padStart(7)} | ${metrics.loadComplete.padStart(8)} | ${status.padEnd(10)}`
      );
    }
  });

  console.log('-'.repeat(110));
  console.log('\nTarget Thresholds: FCP < 2s | LCP < 3s | CLS < 0.1 | Score > 80\n');

  // Summary
  console.log('='.repeat(110));
  console.log('SUMMARY');
  console.log('='.repeat(110));

  const successResults = results.filter(r => !r.error);
  if (successResults.length > 0) {
    const avgScore = (successResults.reduce((sum, r) => sum + r.metrics.performanceScore, 0) / successResults.length).toFixed(0);
    const avgFcp = (successResults.reduce((sum, r) => sum + parseFloat(r.metrics.fcp), 0) / successResults.length).toFixed(2);
    const avgLcp = (successResults.reduce((sum, r) => sum + parseFloat(r.metrics.lcp), 0) / successResults.length).toFixed(2);
    const avgCls = (successResults.reduce((sum, r) => sum + parseFloat(r.metrics.cls), 0) / successResults.length).toFixed(3);

    console.log(`Average Performance Score: ${avgScore}/100`);
    console.log(`Average FCP: ${avgFcp}s (target < 2s) ${parseFloat(avgFcp) < 2 ? '✓' : '✗'}`);
    console.log(`Average LCP: ${avgLcp}s (target < 3s) ${parseFloat(avgLcp) < 3 ? '✓' : '✗'}`);
    console.log(`Average CLS: ${avgCls} (target < 0.1) ${parseFloat(avgCls) < 0.1 ? '✓' : '✗'}`);

    const passCount = successResults.filter(r =>
      parseFloat(r.metrics.fcp) < 2 &&
      parseFloat(r.metrics.lcp) < 3 &&
      parseFloat(r.metrics.cls) < 0.1 &&
      r.metrics.performanceScore > 80
    ).length;

    console.log(`\nRoutes Meeting All Targets: ${passCount}/${successResults.length}`);

    console.log('\n' + '-'.repeat(110));
    console.log('DETAILED METRICS BY ROUTE:');
    console.log('-'.repeat(110));

    successResults.forEach((r) => {
      console.log(`\n${r.route.toUpperCase()} (${r.path})`);
      console.log(`  First Contentful Paint (FCP): ${r.metrics.fcp}s (target < 2s) ${parseFloat(r.metrics.fcp) < 2 ? '✓' : '✗'}`);
      console.log(`  Largest Contentful Paint (LCP): ${r.metrics.lcp}s (target < 3s) ${parseFloat(r.metrics.lcp) < 3 ? '✓' : '✗'}`);
      console.log(`  Cumulative Layout Shift (CLS): ${r.metrics.cls} (target < 0.1) ${parseFloat(r.metrics.cls) < 0.1 ? '✓' : '✗'}`);
      console.log(`  Performance Score: ${r.metrics.performanceScore}/100 (target > 80) ${r.metrics.performanceScore > 80 ? '✓' : '✗'}`);
      console.log(`  Time to First Byte (TTFB): ${r.metrics.ttfb}s`);
      console.log(`  DOM Content Loaded: ${r.metrics.dcl}s`);
      console.log(`  Full Page Load: ${r.metrics.loadComplete}s`);
      console.log(`  Total Audit Duration: ${r.duration}ms`);
    });
  }

  console.log('\n' + '='.repeat(110));
  console.log('RECOMMENDATIONS:\n');

  const slowRoutes = successResults.filter(r => parseFloat(r.metrics.lcp) > 2.5);
  if (slowRoutes.length > 0) {
    console.log('❌ Routes with slow LCP (> 2.5s):');
    slowRoutes.forEach(r => {
      console.log(`   - ${r.route}: ${r.metrics.lcp}s`);
    });
    console.log('   → Optimize images, lazy-load non-critical content, reduce JS bundle size\n');
  }

  const highCLS = successResults.filter(r => parseFloat(r.metrics.cls) > 0.05);
  if (highCLS.length > 0) {
    console.log('❌ Routes with high CLS (> 0.05):');
    highCLS.forEach(r => {
      console.log(`   - ${r.route}: ${r.metrics.cls}`);
    });
    console.log('   → Reserve space for images/ads, avoid inserting dynamic content\n');
  }

  const lowScore = successResults.filter(r => r.metrics.performanceScore < 80);
  if (lowScore.length > 0) {
    console.log('⚠️  Routes with Performance Score < 80:');
    lowScore.forEach(r => {
      console.log(`   - ${r.route}: ${r.metrics.performanceScore}/100`);
    });
    console.log('   → Run full Lighthouse audit for detailed improvement suggestions\n');
  }

  if (slowRoutes.length === 0 && highCLS.length === 0 && lowScore.length === 0) {
    console.log('✓ All routes are performing well!');
    console.log('  - Keep monitoring performance as the app grows');
    console.log('  - Test on slower devices and networks regularly\n');
  }

  console.log('='.repeat(110));
}

main().catch(console.error);
