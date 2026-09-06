#!/usr/bin/env node

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

// Routes to audit - using accessible routes for now since protected routes require auth
const AUDIT_ROUTES = [
  // Accessible routes (no auth required)
  { path: '/', name: 'Feed', auth: false },
  { path: '/welcome', name: 'Welcome (Landing)', auth: false },
  { path: '/login', name: 'Login', auth: false },
  // Protected routes (require auth - will show login page)
  { path: '/plan', name: 'Plan', auth: true },
  { path: '/recipes', name: 'Recipes', auth: true },
  { path: '/basket', name: 'Basket', auth: true },
  { path: '/split', name: 'Split', auth: true },
];

const VIEWPORTS = [
  { width: 375, height: 812, name: 'Mobile (375x812)' },
  { width: 1440, height: 900, name: 'Desktop (1440x900)' },
];

const BASE_URL = 'http://localhost:3002';
const OUTPUT_DIR = '.accessibility-audit';

// WCAG color contrast calculator
function luminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(x => {
    x = x / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function parseRgb(rgbString) {
  const match = rgbString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!match) return null;
  return { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]) };
}

function getContrastRatio(color1, color2) {
  const rgb1 = parseRgb(color1);
  const rgb2 = parseRgb(color2);
  if (!rgb1 || !rgb2) return null;

  const lum1 = luminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = luminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return ((lighter + 0.05) / (darker + 0.05)).toFixed(2);
}

function getWcagLevel(ratio) {
  const r = parseFloat(ratio);
  if (r >= 7) return { aa: 'AAA', aaa: 'AAA' };
  if (r >= 4.5) return { aa: 'AA', aaa: 'AA (Large)' };
  if (r >= 3) return { aa: 'AA (Large)', aaa: 'Fail' };
  return { aa: 'Fail', aaa: 'Fail' };
}

async function runAxeAudit(page, routeName) {
  try {
    const results = await page.evaluate(async () => {
      if (typeof axe === 'undefined') {
        return null;
      }

      return new Promise((resolve) => {
        axe.run((error, results) => {
          if (error) {
            resolve(null);
          } else {
            resolve({
              violations: results.violations.map(v => ({
                id: v.id,
                impact: v.impact,
                description: v.description,
                nodes: v.nodes.length,
              })),
              passes: results.passes.length,
              incomplete: results.incomplete.length,
            });
          }
        });
      });
    });

    return results;
  } catch (error) {
    console.error(`  Error running axe on ${routeName}:`, error.message);
    return null;
  }
}

async function analyzeColorContrast(page, routeName) {
  try {
    const contrastDetails = await page.evaluate(() => {
      const results = [];
      const checked = new Set();

      document.querySelectorAll('body, body *').forEach((el) => {
        const text = el.innerText?.trim().substring(0, 100);
        if (!text || text.length < 3) return;

        const style = window.getComputedStyle(el);
        const bgColor = style.backgroundColor;
        const textColor = style.color;
        const fontSize = parseInt(style.fontSize);

        if (bgColor === 'rgba(0, 0, 0, 0)') return;

        const key = `${bgColor}|${textColor}`;
        if (checked.has(key)) return;
        checked.add(key);

        results.push({
          text: text.substring(0, 40),
          tag: el.tagName,
          bgColor: bgColor,
          textColor: textColor,
          fontSize: fontSize,
          isLargeText: fontSize >= 18,
        });
      });

      return results;
    });

    const analyzed = contrastDetails.map(item => {
      const ratio = getContrastRatio(item.textColor, item.bgColor);
      const wcag = ratio ? getWcagLevel(ratio) : null;
      const pass = parseFloat(ratio || 0) >= 4.5;

      return {
        ...item,
        contrastRatio: ratio,
        wcagAA: wcag?.aa || 'N/A',
        pass: pass,
      };
    });

    return analyzed;
  } catch (error) {
    console.error(`  Error analyzing contrast on ${routeName}:`, error.message);
    return [];
  }
}

async function scanPage(page, route, viewport) {
  const url = `${BASE_URL}${route.path}`;
  const routeLabel = `${route.name} (${route.path}) - ${viewport.name}`;

  try {
    console.log(`    Scanning ${routeLabel}...`);

    // Navigate and inject axe
    await page.goto(url, { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(500);

    // Inject axe-core
    try {
      await page.addScriptTag({ url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.8.0/axe.min.js' });
      await page.waitForTimeout(300);
    } catch (e) {
      // axe injection may fail due to CSP, continue without it
    }

    // Get page info
    const pageInfo = await page.evaluate(() => {
      return {
        title: document.title,
        h1Count: document.querySelectorAll('h1').length,
        buttonCount: document.querySelectorAll('button').length,
        linkCount: document.querySelectorAll('a').length,
        lang: document.documentElement.lang,
      };
    });

    // Run axe audit
    const axeResults = await runAxeAudit(page, route.name);

    // Check color contrast
    const contrastData = await analyzeColorContrast(page, route.name);
    const contrastFailed = contrastData.filter(d => !d.pass);

    return {
      route: route.path,
      name: route.name,
      viewport: viewport.name,
      viewportDimensions: viewport,
      url: url,
      pageInfo: pageInfo,
      axeResults: axeResults,
      contrastAnalysis: {
        total: contrastData.length,
        passed: contrastData.filter(d => d.pass).length,
        failed: contrastFailed.length,
        failures: contrastFailed.slice(0, 5),
      },
    };
  } catch (error) {
    return {
      route: route.path,
      name: route.name,
      viewport: viewport.name,
      error: error.message,
    };
  }
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log('🔍 Full Accessibility Audit - All Routes & Viewports\n');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Routes: ${AUDIT_ROUTES.length}`);
  console.log(`Viewports: ${VIEWPORTS.map(v => v.name).join(', ')}`);
  console.log(`Total audits: ${AUDIT_ROUTES.length * VIEWPORTS.length}\n`);

  const browser = await chromium.launch({ headless: true });
  const allResults = [];

  try {
    for (const route of AUDIT_ROUTES) {
      console.log(`\n📍 ${route.name} (${route.path})`);

      for (const viewport of VIEWPORTS) {
        const page = await browser.newPage();
        page.setViewportSize({ width: viewport.width, height: viewport.height });

        try {
          const result = await scanPage(page, route, viewport);
          allResults.push(result);

          if (result.error) {
            console.log(`      ❌ Error: ${result.error}`);
          } else {
            console.log(`      ✅ ${viewport.name} - axe: ${result.axeResults?.violations?.length || 0} violations`);
            if (result.contrastAnalysis.failed > 0) {
              console.log(`         Contrast: ${result.contrastAnalysis.failed} issues found`);
            }
          }
        } finally {
          await page.close();
        }
      }
    }

    // Save detailed results
    const summaryPath = path.join(OUTPUT_DIR, 'full-a11y-audit.json');
    fs.writeFileSync(summaryPath, JSON.stringify(allResults, null, 2));
    console.log(`\n\n📄 Full results saved to: ${summaryPath}`);

    // Generate summary report
    generateSummaryReport(allResults);

  } finally {
    await browser.close();
  }
}

function generateSummaryReport(results) {
  const lines = [
    '═══════════════════════════════════════════════════════════',
    'FULL ACCESSIBILITY AUDIT REPORT',
    '═══════════════════════════════════════════════════════════',
    `Generated: ${new Date().toLocaleString()}`,
    `Base URL: http://localhost:3002`,
    '',
    'VIOLATIONS SUMMARY BY ROUTE & VIEWPORT',
    '───────────────────────────────────────────────────────────',
  ];

  const byRoute = {};
  results.forEach(r => {
    if (!byRoute[r.name]) byRoute[r.name] = [];
    byRoute[r.name].push(r);
  });

  for (const [routeName, routeResults] of Object.entries(byRoute)) {
    lines.push(`\n${routeName} (${routeResults[0].route})`);

    routeResults.forEach(r => {
      if (r.error) {
        lines.push(`  ${r.viewport}: ❌ ${r.error}`);
        return;
      }

      const violations = r.axeResults?.violations || [];
      const contrastIssues = r.contrastAnalysis.failed;

      lines.push(`\n  ${r.viewport}:`);
      lines.push(`    Page: ${r.pageInfo.title}`);
      lines.push(`    Elements: ${r.pageInfo.h1Count} H1, ${r.pageInfo.buttonCount} buttons, ${r.pageInfo.linkCount} links`);

      if (violations.length > 0) {
        lines.push(`    axe-core violations: ${violations.length}`);
        violations.forEach(v => {
          const severity = v.impact ? `[${v.impact.toUpperCase()}]` : '';
          lines.push(`      • ${v.id} ${severity}: ${v.nodes} node(s)`);
        });
      } else {
        lines.push(`    axe-core violations: 0 ✓`);
      }

      if (contrastIssues > 0) {
        lines.push(`    Color contrast issues: ${contrastIssues}`);
        r.contrastAnalysis.failures.forEach(f => {
          lines.push(`      • ${f.contrastRatio}:1 - "${f.text}" (${f.tag})`);
          lines.push(`        WCAG AA: ${f.wcagAA}`);
        });
      } else {
        lines.push(`    Color contrast: All passed ✓`);
      }
    });
  }

  lines.push('');
  lines.push('═══════════════════════════════════════════════════════════');
  lines.push('AGGREGATE STATISTICS');
  lines.push('───────────────────────────────────────────────────────────');

  let totalViolations = 0;
  let totalContrastIssues = 0;
  let successfulAudits = 0;

  results.forEach(r => {
    if (!r.error) {
      totalViolations += r.axeResults?.violations?.length || 0;
      totalContrastIssues += r.contrastAnalysis.failed;
      successfulAudits++;
    }
  });

  lines.push(`Total audits run: ${results.length}`);
  lines.push(`Successful: ${successfulAudits}`);
  lines.push(`Total axe-core violations: ${totalViolations}`);
  lines.push(`Total contrast issues: ${totalContrastIssues}`);

  lines.push('');
  lines.push('PROTECTED ROUTES NOTE:');
  lines.push('Routes marked as [Protected] show login page content because');
  lines.push('authentication is required. For full audit of authenticated UI:');
  lines.push('1. Create test user account');
  lines.push('2. Log in via browser');
  lines.push('3. Re-run audit with authenticated session');

  const reportPath = path.join(OUTPUT_DIR, 'full-a11y-audit-summary.txt');
  fs.writeFileSync(reportPath, lines.join('\n'));
  console.log(`📝 Summary report saved to: ${reportPath}`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
