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

  // Extract metrics from audits
  if (audits['first-contentful-paint']) {
    metrics.fcp = (audits['first-contentful-paint'].numericValue / 1000).toFixed(2);
  }

  if (audits['largest-contentful-paint']) {
    metrics.lcp = (audits['largest-contentful-paint'].numericValue / 1000).toFixed(2);
  }

  if (audits['cumulative-layout-shift']) {
    metrics.cls = audits['cumulative-layout-shift'].numericValue.toFixed(3);
  }

  // Extract opportunities
  const opportunities = [];
  Object.entries(audits).forEach(([key, audit]) => {
    if (
      audit.type === 'opportunity' &&
      audit.details &&
      (audit.details.type === 'opportunity' || audit.details.type === 'subitems')
    ) {
      opportunities.push({
        id: key,
        title: audit.title,
        savings: audit.details.overallSavingsMs || 0,
        description: audit.description,
      });
    }
  });

  // Sort by savings
  opportunities.sort((a, b) => b.savings - a.savings);

  return {
    metrics,
    opportunities: opportunities.slice(0, 5), // Top 5 opportunities
    allAudits: audits,
  };
}

function main() {
  console.log('='.repeat(120));
  console.log('LIGHTHOUSE PERFORMANCE AUDIT REPORT - 1440px Desktop (No Throttle)');
  console.log('='.repeat(120));
  console.log();

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

  // Metrics Table
  console.log('PERFORMANCE METRICS:');
  console.log('-'.repeat(120));
  console.log('Route       | FCP (s) | LCP (s) | CLS    | Score | FCP Target | LCP Target | CLS Target | Score Target');
  console.log('-'.repeat(120));

  results.forEach(result => {
    const { metrics } = result;
    const fcp = parseFloat(metrics.fcp);
    const lcp = parseFloat(metrics.lcp);
    const cls = parseFloat(metrics.cls);
    const score = metrics.performanceScore;

    const fcpOk = fcp < 2 ? '✓' : '✗';
    const lcpOk = lcp < 3 ? '✓' : '✗';
    const clsOk = cls < 0.1 ? '✓' : '✗';
    const scoreOk = score > 80 ? '✓' : '✗';

    console.log(
      `${result.name.padEnd(11)}| ${metrics.fcp.padStart(7)} | ${metrics.lcp.padStart(7)} | ${metrics.cls.padStart(6)} | ${score.toString().padStart(5)} | ${fcpOk.padEnd(10)} | ${lcpOk.padEnd(10)} | ${clsOk.padEnd(10)} | ${scoreOk}`
    );
  });

  console.log('-'.repeat(120));
  console.log('Targets: FCP < 2s | LCP < 3s | CLS < 0.1 | Score > 80\n');

  // Detailed Metrics
  console.log('='.repeat(120));
  console.log('DETAILED METRICS BY ROUTE:');
  console.log('='.repeat(120));
  console.log();

  results.forEach((result, idx) => {
    const { metrics } = result;
    const fcp = parseFloat(metrics.fcp);
    const lcp = parseFloat(metrics.lcp);
    const cls = parseFloat(metrics.cls);
    const score = metrics.performanceScore;

    console.log(`${idx + 1}. ${result.name.toUpperCase()} (${result.path})`);
    console.log('-'.repeat(120));

    console.log(`   Performance Score: ${score}/100 ${score > 80 ? '✓ PASS' : '✗ NEEDS WORK'}`);
    console.log(`   First Contentful Paint (FCP): ${metrics.fcp}s ${fcp < 2 ? '✓ (< 2s)' : '✗ (target: < 2s)'}`);
    console.log(`   Largest Contentful Paint (LCP): ${metrics.lcp}s ${lcp < 3 ? '✓ (< 3s)' : '✗ (target: < 3s)'}`);
    console.log(`   Cumulative Layout Shift (CLS): ${metrics.cls} ${cls < 0.1 ? '✓ (< 0.1)' : '✗ (target: < 0.1)'}`);

    console.log();
  });

  // Opportunities Section
  console.log('='.repeat(120));
  console.log('TOP OPPORTUNITIES FOR IMPROVEMENT:');
  console.log('='.repeat(120));
  console.log();

  results.forEach((result, idx) => {
    console.log(`${idx + 1}. ${result.name.toUpperCase()} (${result.path})`);
    console.log('-'.repeat(120));

    if (result.opportunities.length > 0) {
      result.opportunities.forEach((opp, oppIdx) => {
        const savings = opp.savings > 0 ? ` (~${opp.savings}ms savings)` : '';
        console.log(`   ${oppIdx + 1}. ${opp.title}${savings}`);
      });
    } else {
      console.log('   No opportunities detected.');
    }

    console.log();
  });

  // Summary Statistics
  console.log('='.repeat(120));
  console.log('SUMMARY STATISTICS:');
  console.log('='.repeat(120));
  console.log();

  const avgScore = (results.reduce((sum, r) => sum + r.metrics.performanceScore, 0) / results.length).toFixed(0);
  const avgFcp = (results.reduce((sum, r) => sum + parseFloat(r.metrics.fcp), 0) / results.length).toFixed(2);
  const avgLcp = (results.reduce((sum, r) => sum + parseFloat(r.metrics.lcp), 0) / results.length).toFixed(2);
  const avgCls = (results.reduce((sum, r) => sum + parseFloat(r.metrics.cls), 0) / results.length).toFixed(3);

  console.log(`Overall Average Performance Score: ${avgScore}/100 ${avgScore > 80 ? '✓' : '✗'}`);
  console.log(`Average FCP: ${avgFcp}s ${parseFloat(avgFcp) < 2 ? '✓' : '✗'}`);
  console.log(`Average LCP: ${avgLcp}s ${parseFloat(avgLcp) < 3 ? '✓' : '✗'}`);
  console.log(`Average CLS: ${avgCls} ${parseFloat(avgCls) < 0.1 ? '✓' : '✗'}`);

  const passCount = results.filter(r => {
    const fcp = parseFloat(r.metrics.fcp);
    const lcp = parseFloat(r.metrics.lcp);
    const cls = parseFloat(r.metrics.cls);
    const score = r.metrics.performanceScore;

    return fcp < 2 && lcp < 3 && cls < 0.1 && score > 80;
  }).length;

  console.log(`\nRoutes Meeting All Targets: ${passCount}/${results.length}`);
  console.log();

  // Recommendations
  console.log('='.repeat(120));
  console.log('RECOMMENDATIONS:');
  console.log('='.repeat(120));
  console.log();

  const slowFCP = results.filter(r => parseFloat(r.metrics.fcp) >= 2);
  const slowLCP = results.filter(r => parseFloat(r.metrics.lcp) >= 3);
  const highCLS = results.filter(r => parseFloat(r.metrics.cls) >= 0.1);
  const lowScore = results.filter(r => r.metrics.performanceScore < 80);

  if (slowFCP.length > 0) {
    console.log('⚠️  First Contentful Paint Issues (FCP >= 2s):');
    slowFCP.forEach(r => {
      console.log(`   • ${r.name}: ${r.metrics.fcp}s`);
    });
    console.log('   Recommendations:');
    console.log('   - Minimize critical CSS and JavaScript');
    console.log('   - Optimize font loading (reduce FOUT/FLIT)');
    console.log('   - Pre-connect to critical origins\n');
  }

  if (slowLCP.length > 0) {
    console.log('⚠️  Largest Contentful Paint Issues (LCP >= 3s):');
    slowLCP.forEach(r => {
      console.log(`   • ${r.name}: ${r.metrics.lcp}s`);
    });
    console.log('   Recommendations:');
    console.log('   - Optimize images (format, size, lazy-loading)');
    console.log('   - Reduce server response time (TTFB)');
    console.log('   - Minimize JavaScript execution time');
    console.log('   - Use CDN for static assets\n');
  }

  if (highCLS.length > 0) {
    console.log('⚠️  Cumulative Layout Shift Issues (CLS >= 0.1):');
    highCLS.forEach(r => {
      console.log(`   • ${r.name}: ${r.metrics.cls}`);
    });
    console.log('   Recommendations:');
    console.log('   - Set explicit dimensions for images and video');
    console.log('   - Avoid inserting content above existing content');
    console.log('   - Use transform animations instead of position changes\n');
  }

  if (lowScore.length > 0) {
    console.log('⚠️  Low Performance Scores (< 80):');
    lowScore.forEach(r => {
      console.log(`   • ${r.name}: ${r.metrics.performanceScore}/100`);
    });
    console.log('   Recommendations:');
    console.log('   - Focus on the Core Web Vitals metrics above\n');
  }

  if (slowFCP.length === 0 && slowLCP.length === 0 && highCLS.length === 0 && lowScore.length === 0) {
    console.log('✓ All routes are performing well within targets!');
    console.log('   • Continue monitoring performance as the application grows');
    console.log('   • Test on slower devices and 4G networks regularly');
    console.log('   • Monitor real user metrics (RUM) in production\n');
  }

  console.log('='.repeat(120));
  console.log('Report generated at:', new Date().toISOString());
  console.log('='.repeat(120));
}

main();
