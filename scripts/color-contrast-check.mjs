#!/usr/bin/env node

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

// WCAG color contrast ratio calculator
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
  if (r >= 7) return { aa: 'AAA (Large)', aaa: 'AAA' };
  if (r >= 4.5) return { aa: 'AA', aaa: 'AA (Large)' };
  if (r >= 3) return { aa: 'AA (Large)', aaa: 'Fail' };
  return { aa: 'Fail', aaa: 'Fail' };
}

const ROUTES = [
  { path: '/', name: 'Feed' },
  { path: '/welcome', name: 'Welcome' },
  { path: '/login', name: 'Login' },
];

const BASE_URL = 'http://localhost:3002';

async function analyzeColorContrast(page, routeName) {
  try {
    const contrastDetails = await page.evaluate(() => {
      const results = [];
      const checked = new Set();

      // Get all elements with text content
      document.querySelectorAll('body, body *').forEach((el) => {
        const text = el.innerText?.trim().substring(0, 100);
        if (!text || text.length < 3) return;

        const style = window.getComputedStyle(el);
        const bgColor = style.backgroundColor;
        const textColor = style.color;
        const fontSize = parseInt(style.fontSize);
        const fontWeight = style.fontWeight;

        // Skip transparent backgrounds
        if (bgColor === 'rgba(0, 0, 0, 0)') return;

        const key = `${bgColor}|${textColor}`;
        if (checked.has(key)) return;
        checked.add(key);

        results.push({
          text: text,
          tag: el.tagName,
          class: el.className?.substring(0, 200),
          bgColor: bgColor,
          textColor: textColor,
          fontSize: fontSize,
          fontWeight: fontWeight,
          isLargeText: fontSize >= 18,
        });
      });

      return results;
    });

    // Calculate contrast ratios
    const analyzed = contrastDetails.map(item => {
      const ratio = getContrastRatio(item.textColor, item.bgColor);
      const wcag = ratio ? getWcagLevel(ratio) : null;

      return {
        ...item,
        contrastRatio: ratio,
        wcagAA: wcag?.aa || 'N/A',
        wcagAAA: wcag?.aaa || 'N/A',
      };
    });

    return analyzed;
  } catch (error) {
    console.error(`Error analyzing ${routeName}:`, error.message);
    return [];
  }
}

async function main() {
  const outputDir = '.accessibility-audit';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('🎨 Running Detailed Color Contrast Analysis\n');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Routes: ${ROUTES.length}\n`);

  const browser = await chromium.launch({ headless: true });
  const results = {};

  try {
    for (const route of ROUTES) {
      const url = `${BASE_URL}${route.path}`;
      console.log(`📊 Analyzing ${route.name} (${url})...`);

      const page = await browser.newPage();
      page.setViewportSize({ width: 375, height: 812 });

      try {
        await page.goto(url, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const contrastData = await analyzeColorContrast(page, route.name);

        // Categorize by contrast level
        const passed = contrastData.filter(d => parseFloat(d.contrastRatio || 0) >= 4.5);
        const failed = contrastData.filter(d => parseFloat(d.contrastRatio || 0) < 4.5);
        const largeTextFailed = failed.filter(d => d.isLargeText && parseFloat(d.contrastRatio || 0) < 3);

        results[route.name] = {
          route: route.path,
          url: url,
          total: contrastData.length,
          passed: passed.length,
          failed: failed.length,
          largeTextFailed: largeTextFailed.length,
          details: contrastData.sort((a, b) => {
            const aRatio = parseFloat(a.contrastRatio || 0);
            const bRatio = parseFloat(b.contrastRatio || 0);
            return aRatio - bRatio;
          }),
        };

        console.log(`  ✅ Passed (4.5:1+): ${passed.length}/${contrastData.length}`);
        if (failed.length > 0) {
          console.log(`  ⚠️  Failed: ${failed.length} combinations`);
          if (largeTextFailed.length > 0) {
            console.log(`  🔴 Large text WCAG failures: ${largeTextFailed.length}`);
          }
        }

        // Show lowest contrast items
        const worst = contrastData.slice(0, 3);
        console.log(`  Lowest contrast ratios:`);
        worst.forEach(item => {
          console.log(
            `    • ${item.contrastRatio}:1 - "${item.text.substring(0, 30)}..." (${item.tag})`
          );
        });

      } finally {
        await page.close();
      }
    }

    // Save full results
    const summaryPath = path.join(outputDir, 'color-contrast-details.json');
    fs.writeFileSync(summaryPath, JSON.stringify(results, null, 2));
    console.log(`\n📄 Detailed results saved to: ${summaryPath}`);

    // Generate readable report
    generateReport(results);

  } finally {
    await browser.close();
  }
}

function generateReport(results) {
  const lines = [
    '═══════════════════════════════════════════════════════════',
    'COLOR CONTRAST AUDIT REPORT',
    '═══════════════════════════════════════════════════════════',
    `Generated: ${new Date().toLocaleString()}`,
    '',
    'WCAG 2.1 Compliance Levels:',
    '  • AA: 4.5:1 for normal text, 3:1 for large text (18pt+)',
    '  • AAA: 7:1 for normal text, 4.5:1 for large text',
    '',
    '═══════════════════════════════════════════════════════════',
  ];

  for (const [routeName, routeData] of Object.entries(results)) {
    lines.push(`\n${routeName} (${routeData.route})`);
    lines.push('───────────────────────────────────────────────────────────');
    lines.push(`Total color combinations: ${routeData.total}`);
    lines.push(`Passed WCAG AA: ${routeData.passed}`);
    lines.push(`Failed WCAG AA: ${routeData.failed}`);
    lines.push(`Large text failures: ${routeData.largeTextFailed}`);

    // Show elements with issues
    const failed = routeData.details.filter(d => parseFloat(d.contrastRatio || 0) < 4.5);
    if (failed.length > 0) {
      lines.push(`\nContrast issues found:`);
      failed.forEach(item => {
        lines.push(`  ${item.contrastRatio}:1 - "${item.text.substring(0, 40)}..."`);
        lines.push(`    Tag: ${item.tag}, Class: ${item.class?.substring(0, 60) || 'none'}`);
        lines.push(
          `    Background: ${item.bgColor}, Text: ${item.textColor}`
        );
        lines.push(
          `    WCAG AA: ${item.wcagAA} | AAA: ${item.wcagAAA} | Large text: ${item.isLargeText}`
        );
      });
    }
  }

  lines.push('');
  lines.push('═══════════════════════════════════════════════════════════');
  lines.push('SUMMARY');
  lines.push('───────────────────────────────────────────────────────────');

  let totalPassed = 0;
  let totalFailed = 0;
  let totalLargeTextFailed = 0;

  for (const routeData of Object.values(results)) {
    totalPassed += routeData.passed;
    totalFailed += routeData.failed;
    totalLargeTextFailed += routeData.largeTextFailed;
  }

  lines.push(`Total color combinations scanned: ${totalPassed + totalFailed}`);
  lines.push(`WCAG AA compliant: ${totalPassed}`);
  lines.push(`WCAG AA failures: ${totalFailed}`);
  lines.push(`Large text WCAG failures: ${totalLargeTextFailed}`);

  const reportPath = path.join('.accessibility-audit', 'color-contrast-report.txt');
  fs.writeFileSync(reportPath, lines.join('\n'));
  console.log(`📝 Readable report saved to: ${reportPath}`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
