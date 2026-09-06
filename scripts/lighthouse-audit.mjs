import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3002';
const ROUTES = [
  { name: 'Feed', path: '/' },
  { name: 'Plan', path: '/plan' },
  { name: 'Recipes', path: '/recipes' },
  { name: 'Basket', path: '/basket' },
  { name: 'Split', path: '/split' },
];

const LIGHTHOUSE_CONFIG = {
  logLevel: 'info',
  output: 'json',
  onlyCategories: ['performance'],
  emulatedFormFactor: 'desktop',
  throttling: {
    rttMs: 0,
    throughputKbps: 0,
    requestLatencyMs: 0,
    downloadThroughputKbps: 0,
    uploadThroughputKbps: 0,
    cpuSlowdownMultiplier: 1,
  },
};

const chromiumPath = path.join(
  process.cwd(),
  'node_modules/chromium/bin/chromium'
);

async function runAudit(url) {
  let chrome;
  try {
    chrome = await chromeLauncher.launch({
      chromeFlags: ['--headless', '--no-sandbox'],
      chromePath: chromiumPath,
    });

    const options = {
      logLevel: 'error',
      output: 'json',
      onlyCategories: ['performance'],
      port: chrome.port,
      emulatedFormFactor: 'desktop',
      throttling: LIGHTHOUSE_CONFIG.throttling,
    };

    const runnerResult = await lighthouse(url, options);

    chrome.kill();

    return runnerResult;
  } catch (error) {
    if (chrome) chrome.kill();
    throw error;
  }
}

function extractMetrics(lighthouseResult) {
  const { audits, categories } = lighthouseResult;

  const metrics = {
    fcp: null,
    lcp: null,
    cls: null,
    performanceScore: categories.performance.score * 100,
  };

  // First Contentful Paint
  if (audits['first-contentful-paint']) {
    metrics.fcp = (audits['first-contentful-paint'].numericValue / 1000).toFixed(2);
  }

  // Largest Contentful Paint
  if (audits['largest-contentful-paint']) {
    metrics.lcp = (audits['largest-contentful-paint'].numericValue / 1000).toFixed(2);
  }

  // Cumulative Layout Shift
  if (audits['cumulative-layout-shift']) {
    metrics.cls = audits['cumulative-layout-shift'].numericValue.toFixed(3);
  }

  return metrics;
}

function extractOpportunities(lighthouseResult) {
  const opportunities = [];

  Object.entries(lighthouseResult.audits).forEach(([key, audit]) => {
    if (
      audit.type === 'opportunity' &&
      audit.details &&
      audit.details.type === 'opportunity'
    ) {
      opportunities.push({
        title: audit.title,
        savings: audit.details.overallSavingsMs || 0,
        description: audit.description,
      });
    }
  });

  // Sort by savings (time saved)
  opportunities.sort((a, b) => b.savings - a.savings);

  return opportunities.slice(0, 3); // Top 3
}

async function main() {
  console.log('Starting Lighthouse Audits at 1440px Desktop...\n');

  const results = [];

  for (const route of ROUTES) {
    const url = BASE_URL + route.path;
    console.log(`Auditing ${route.name} (${url})...`);

    try {
      const runnerResult = await runAudit(url);
      const metrics = extractMetrics(runnerResult.lhr);
      const opportunities = extractOpportunities(runnerResult.lhr);

      results.push({
        route: route.name,
        url: route.path,
        metrics,
        opportunities,
      });

      console.log(`  ✓ Complete: Performance Score ${metrics.performanceScore.toFixed(0)}`);
    } catch (error) {
      console.error(`  ✗ Error auditing ${route.name}:`, error.message);
      results.push({
        route: route.name,
        url: route.path,
        error: error.message,
      });
    }
  }

  // Output results
  console.log('\n' + '='.repeat(100));
  console.log('LIGHTHOUSE AUDIT RESULTS - 1440px Desktop (No Throttle)\n');

  // Metrics table
  console.log('PERFORMANCE METRICS:');
  console.log('-'.repeat(100));
  console.log('Route       | FCP (s) | LCP (s) | CLS    | Performance Score | Target Met?');
  console.log('-'.repeat(100));

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

      console.log(
        `${result.route.padEnd(11)}| ${metrics.fcp.padStart(7)} | ${metrics.lcp.padStart(7)} | ${metrics.cls.padStart(6)} | ${score.toFixed(0).padStart(17)} | ${fcpOk}/${lcpOk}/${clsOk}/${scoreOk}`
      );
    }
  });

  console.log('-'.repeat(100));
  console.log('\nTarget Thresholds: FCP < 2s | LCP < 3s | CLS < 0.1 | Score > 80\n');

  // Opportunities
  console.log('TOP OPPORTUNITIES BY ROUTE:');
  console.log('='.repeat(100));

  results.forEach((result, idx) => {
    if (!result.error && result.opportunities.length > 0) {
      console.log(`\n${idx + 1}. ${result.route.toUpperCase()} (${result.url})`);
      console.log('-'.repeat(100));

      result.opportunities.forEach((opp, oppIdx) => {
        const savings = opp.savings > 0 ? ` (~${opp.savings}ms)` : '';
        console.log(`   ${oppIdx + 1}. ${opp.title}${savings}`);
      });
    }
  });

  // Summary
  console.log('\n' + '='.repeat(100));
  console.log('SUMMARY');
  console.log('='.repeat(100));

  const metricsResults = results.filter(r => !r.error);
  if (metricsResults.length > 0) {
    const avgScore = (metricsResults.reduce((sum, r) => sum + r.metrics.performanceScore, 0) / metricsResults.length).toFixed(0);
    const avgFcp = (metricsResults.reduce((sum, r) => sum + parseFloat(r.metrics.fcp), 0) / metricsResults.length).toFixed(2);
    const avgLcp = (metricsResults.reduce((sum, r) => sum + parseFloat(r.metrics.lcp), 0) / metricsResults.length).toFixed(2);
    const avgCls = (metricsResults.reduce((sum, r) => sum + parseFloat(r.metrics.cls), 0) / metricsResults.length).toFixed(3);

    console.log(`Average Performance Score: ${avgScore}/100`);
    console.log(`Average FCP: ${avgFcp}s (target < 2s)`);
    console.log(`Average LCP: ${avgLcp}s (target < 3s)`);
    console.log(`Average CLS: ${avgCls} (target < 0.1)`);

    const passCount = metricsResults.filter(r =>
      parseFloat(r.metrics.fcp) < 2 &&
      parseFloat(r.metrics.lcp) < 3 &&
      parseFloat(r.metrics.cls) < 0.1 &&
      r.metrics.performanceScore > 80
    ).length;

    console.log(`\nRoutes Meeting All Targets: ${passCount}/${metricsResults.length}`);
  }

  console.log('\n' + '='.repeat(100));
}

main().catch(console.error);
