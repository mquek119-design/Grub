import fs from 'fs';
import path from 'path';

const REPORTS_DIR = './lighthouse-reports';
const ROUTES = [
  { name: 'Feed', file: 'feed.json', path: '/' },
  { name: 'Plan', file: 'plan.json', path: '/plan' },
  { name: 'Recipes', file: 'recipes.json', path: '/recipes' },
  { name: 'Basket', file: 'basket.json', path: '/basket' },
  { name: 'Split', file: 'split.json', path: '/split' },
];

function parseReport(filePath) {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  const audits = data.audits;
  const categories = data.categories;

  const metrics = {
    fcp: null,
    lcp: null,
    cls: null,
    performanceScore: Math.round(categories.performance.score * 100),
  };

  // Extract core metrics
  if (audits['first-contentful-paint']) {
    metrics.fcp = (audits['first-contentful-paint'].numericValue / 1000).toFixed(2);
  }

  if (audits['largest-contentful-paint']) {
    metrics.lcp = (audits['largest-contentful-paint'].numericValue / 1000).toFixed(2);
  }

  if (audits['cumulative-layout-shift']) {
    metrics.cls = audits['cumulative-layout-shift'].numericValue.toFixed(3);
  }

  // Extract additional metrics
  const extraMetrics = {};
  if (audits['speed-index']) {
    extraMetrics.speedIndex = (audits['speed-index'].numericValue / 1000).toFixed(2);
  }
  if (audits['interactive']) {
    extraMetrics.tti = (audits['interactive'].numericValue / 1000).toFixed(2);
  }
  if (audits['total-blocking-time']) {
    extraMetrics.tbt = audits['total-blocking-time'].numericValue.toFixed(0);
  }

  // Extract opportunities
  const opportunities = [];
  Object.entries(audits).forEach(([key, audit]) => {
    if (audit.details && audit.details.type === 'opportunity') {
      opportunities.push({
        id: key,
        title: audit.title,
        savings: audit.details.overallSavingsMs || 0,
        description: audit.description || '',
      });
    }
  });

  // Sort by savings
  opportunities.sort((a, b) => b.savings - a.savings);

  return {
    metrics,
    extraMetrics,
    opportunities: opportunities.slice(0, 6),
  };
}

function main() {
  console.log('\n' + '█'.repeat(130));
  console.log('█' + ' '.repeat(128) + '█');
  console.log('█' + '  LIGHTHOUSE PERFORMANCE AUDIT REPORT'.padEnd(127) + '█');
  console.log('█' + '  1440px Desktop - No Throttle'.padEnd(127) + '█');
  console.log('█' + '  Date: ' + new Date().toISOString().split('T')[0].padEnd(121) + '█');
  console.log('█' + ' '.repeat(128) + '█');
  console.log('█'.repeat(130) + '\n');

  const results = [];

  for (const route of ROUTES) {
    const filePath = path.join(REPORTS_DIR, route.file);
    if (fs.existsSync(filePath)) {
      const result = parseReport(filePath);
      results.push({
        name: route.name,
        path: route.path,
        ...result,
      });
    }
  }

  // Metrics Summary Table
  console.log('╔═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                            CORE WEB VITALS & PERFORMANCE METRICS                                                                 ║');
  console.log('╠════════════╦═════════╦═════════╦═══════╦═══════╦════════════╦════════════╦════════════╦═════════════════════════════════════════╣');
  console.log('║ Route      ║ FCP (s) ║ LCP (s) ║ CLS   ║ Score ║ FCP Target ║ LCP Target ║ CLS Target ║ Score Target                           ║');
  console.log('╠════════════╬═════════╬═════════╬═══════╬═══════╬════════════╬════════════╬════════════╬═════════════════════════════════════════╣');

  results.forEach(result => {
    const { metrics } = result;
    const fcp = parseFloat(metrics.fcp);
    const lcp = parseFloat(metrics.lcp);
    const cls = parseFloat(metrics.cls);
    const score = metrics.performanceScore;

    const fcpStatus = fcp < 2 ? '✓' : '✗';
    const lcpStatus = lcp < 3 ? '✓' : '✗';
    const clsStatus = cls < 0.1 ? '✓' : '✗';
    const scoreStatus = score > 80 ? '✓' : '✗';

    const routeName = result.name.padEnd(10);
    const fcpVal = metrics.fcp.padStart(7);
    const lcpVal = metrics.lcp.padStart(7);
    const clsVal = metrics.cls.padStart(5);
    const scoreVal = score.toString().padStart(5);

    console.log(`║ ${routeName} ║ ${fcpVal} ║ ${lcpVal} ║ ${clsVal} ║ ${scoreVal} ║ ${fcpStatus.padEnd(10)} ║ ${lcpStatus.padEnd(10)} ║ ${clsStatus.padEnd(10)} ║ ${scoreStatus.padEnd(35)} ║`);
  });

  console.log('╚════════════╩═════════╩═════════╩═══════╩═══════╩════════════╩════════════╩════════════╩═════════════════════════════════════════╝');
  console.log('\nTarget Thresholds: FCP < 2s (Good) | LCP < 3s (Good) | CLS < 0.1 (Good) | Score > 80/100 (Good)\n');

  // Detailed metrics breakdown
  console.log('╔═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                                        DETAILED METRICS BY ROUTE                                                                 ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝\n');

  results.forEach((result, idx) => {
    const { metrics, extraMetrics } = result;
    const fcp = parseFloat(metrics.fcp);
    const lcp = parseFloat(metrics.lcp);
    const cls = parseFloat(metrics.cls);
    const score = metrics.performanceScore;

    const statusEmoji = (
      fcp < 2 && lcp < 3 && cls < 0.1 && score > 80
    ) ? '✓ PASS' : '✗ NEEDS WORK';

    console.log(`${idx + 1}. ${result.name.toUpperCase()} (${result.path})`);
    console.log('─'.repeat(130));
    console.log(`   Overall Performance: ${score}/100 ${statusEmoji}`);
    console.log();
    console.log(`   Core Web Vitals:`);
    console.log(`   ├─ First Contentful Paint (FCP):      ${metrics.fcp}s  [${fcp < 2 ? '✓ Good' : '✗ Needs improvement'}]  - Content first appears (target: <2s)`);
    console.log(`   ├─ Largest Contentful Paint (LCP):    ${metrics.lcp}s  [${lcp < 3 ? '✓ Good' : '✗ Needs improvement'}]  - Largest element renders (target: <3s)`);
    console.log(`   └─ Cumulative Layout Shift (CLS):     ${metrics.cls}   [${cls < 0.1 ? '✓ Good' : '✗ Needs improvement'}]  - Visual stability (target: <0.1)`);
    console.log();
    console.log(`   Additional Metrics:`);
    console.log(`   ├─ Speed Index:                       ${extraMetrics.speedIndex || 'N/A'}s`);
    console.log(`   ├─ Time to Interactive (TTI):         ${extraMetrics.tti || 'N/A'}s`);
    console.log(`   └─ Total Blocking Time (TBT):         ${extraMetrics.tbt || 'N/A'}ms`);
    console.log();
  });

  // Opportunities Section
  console.log('╔═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                                  OPTIMIZATION OPPORTUNITIES                                                                      ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝\n');

  results.forEach((result, idx) => {
    console.log(`${idx + 1}. ${result.name.toUpperCase()} (${result.path})`);
    console.log('─'.repeat(130));

    if (result.opportunities.length > 0) {
      result.opportunities.forEach((opp, oppIdx) => {
        const savingsStr = opp.savings > 0 ? ` (~${opp.savings.toFixed(0)}ms)` : '';
        console.log(`   ${String(oppIdx + 1).padStart(2)}. ${opp.title}${savingsStr}`);
      });
    } else {
      console.log('   ✓ No significant opportunities detected');
    }
    console.log();
  });

  // Summary Statistics
  console.log('╔═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                                       OVERALL SUMMARY                                                                            ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝\n');

  const avgScore = (results.reduce((sum, r) => sum + r.metrics.performanceScore, 0) / results.length).toFixed(0);
  const avgFcp = (results.reduce((sum, r) => sum + parseFloat(r.metrics.fcp), 0) / results.length).toFixed(2);
  const avgLcp = (results.reduce((sum, r) => sum + parseFloat(r.metrics.lcp), 0) / results.length).toFixed(2);
  const avgCls = (results.reduce((sum, r) => sum + parseFloat(r.metrics.cls), 0) / results.length).toFixed(3);

  console.log(`Overall Performance:`);
  console.log(`├─ Average Performance Score: ${avgScore}/100 ${parseFloat(avgScore) > 80 ? '✓' : '✗'}`);
  console.log(`├─ Average FCP: ${avgFcp}s ${parseFloat(avgFcp) < 2 ? '✓' : '✗'}`);
  console.log(`├─ Average LCP: ${avgLcp}s ${parseFloat(avgLcp) < 3 ? '✓' : '✗'}`);
  console.log(`└─ Average CLS: ${avgCls} ${parseFloat(avgCls) < 0.1 ? '✓' : '✗'}`);

  const passCount = results.filter(r => {
    const fcp = parseFloat(r.metrics.fcp);
    const lcp = parseFloat(r.metrics.lcp);
    const cls = parseFloat(r.metrics.cls);
    const score = r.metrics.performanceScore;
    return fcp < 2 && lcp < 3 && cls < 0.1 && score > 80;
  }).length;

  console.log(`\nTarget Compliance: ${passCount}/${results.length} routes meeting all targets ${passCount === results.length ? '✓' : '✗'}`);
  console.log();

  // Final Recommendations
  console.log('╔═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                                      RECOMMENDATIONS                                                                             ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝\n');

  const slowFCP = results.filter(r => parseFloat(r.metrics.fcp) >= 2);
  const slowLCP = results.filter(r => parseFloat(r.metrics.lcp) >= 3);
  const highCLS = results.filter(r => parseFloat(r.metrics.cls) >= 0.1);
  const lowScore = results.filter(r => r.metrics.performanceScore < 80);

  if (slowFCP.length > 0 || slowLCP.length > 0 || highCLS.length > 0 || lowScore.length > 0) {
    if (slowFCP.length > 0) {
      console.log('⚠️  First Contentful Paint Issues (FCP >= 2s):');
      slowFCP.forEach(r => {
        console.log(`   • ${r.name}: ${r.metrics.fcp}s`);
      });
      console.log('   Action Items:');
      console.log('   • Minimize critical CSS and JavaScript');
      console.log('   • Optimize font loading (reduce FOUT/FLIT)');
      console.log('   • Pre-connect to critical origins');
      console.log('   • Reduce server response time (TTFB)\n');
    }

    if (slowLCP.length > 0) {
      console.log('⚠️  Largest Contentful Paint Issues (LCP >= 3s):');
      slowLCP.forEach(r => {
        console.log(`   • ${r.name}: ${r.metrics.lcp}s`);
      });
      console.log('   Action Items:');
      console.log('   • Optimize images (format, size, lazy-loading)');
      console.log('   • Reduce server response time (TTFB)');
      console.log('   • Minimize JavaScript execution time');
      console.log('   • Use CDN for static assets\n');
    }

    if (highCLS.length > 0) {
      console.log('⚠️  Cumulative Layout Shift Issues (CLS >= 0.1):');
      highCLS.forEach(r => {
        console.log(`   • ${r.name}: ${r.metrics.cls}`);
      });
      console.log('   Action Items:');
      console.log('   • Set explicit dimensions for images and video');
      console.log('   • Avoid inserting content above existing content');
      console.log('   • Use transform animations instead of position changes\n');
    }

    if (lowScore.length > 0) {
      console.log('⚠️  Low Performance Scores (< 80):');
      lowScore.forEach(r => {
        console.log(`   • ${r.name}: ${r.metrics.performanceScore}/100`);
      });
    }
  } else {
    console.log('✓ EXCELLENT PERFORMANCE across all routes!\n');
    console.log('All routes are performing within optimal targets:');
    console.log('• All FCP values < 2s (average: ' + avgFcp + 's)');
    console.log('• All LCP values < 3s (average: ' + avgLcp + 's)');
    console.log('• All CLS values < 0.1 (average: ' + avgCls + ')');
    console.log('• All Performance Scores > 80 (average: ' + avgScore + '/100)\n');
    console.log('Ongoing Best Practices:');
    console.log('• Continue monitoring performance as the application grows');
    console.log('• Test on slower devices and 4G/5G networks regularly');
    console.log('• Monitor real user metrics (RUM) in production');
    console.log('• Review bundle sizes and code splitting opportunities');
  }

  console.log('\n' + '═'.repeat(130));
  console.log(`Report generated: ${new Date().toISOString()}`);
  console.log('═'.repeat(130) + '\n');
}

main();
