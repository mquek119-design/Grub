#!/usr/bin/env node

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const ROUTES = [
  { path: '/', name: 'Feed' },
  { path: '/plan', name: 'Plan' },
  { path: '/recipes', name: 'Recipes' },
  { path: '/basket', name: 'Basket' },
  { path: '/split', name: 'Split' },
  { path: '/welcome', name: 'Welcome (Landing)' },
  { path: '/login', name: 'Login' },
];

const BASE_URL = 'http://localhost:3002';
const OUTPUT_DIR = '.accessibility-audit';

// Load axe-core as text
const AXE_CORE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.8.0/axe.min.js';

async function injectAxe(page) {
  try {
    // Inject axe-core from CDN directly into the page context
    await page.addScriptTag({ url: AXE_CORE_URL });

    // Wait a bit for axe to load
    await page.waitForTimeout(500);

    return true;
  } catch (error) {
    console.warn('Could not inject axe-core from CDN:', error.message);
    return false;
  }
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
              violations: results.violations,
              passes: results.passes,
              incomplete: results.incomplete,
              inapplicable: results.inapplicable,
            });
          }
        });
      });
    });

    return results;
  } catch (error) {
    console.error(`Error running axe on ${routeName}:`, error.message);
    return null;
  }
}

async function analyzeColorContrast(page, routeName) {
  try {
    const contrastInfo = await page.evaluate(() => {
      const results = [];

      // Function to get computed color
      const getComputedColor = (el) => {
        const style = window.getComputedStyle(el);
        return {
          bg: style.backgroundColor,
          text: style.color,
          fontSize: style.fontSize,
        };
      };

      // Check all text elements
      const textElements = document.querySelectorAll('body, body *');
      textElements.forEach((el, idx) => {
        if (idx > 100) return; // Limit samples

        const hasText = el.innerText && el.innerText.trim().length > 0;
        if (hasText) {
          const colors = getComputedColor(el);
          if (colors.bg !== 'rgba(0, 0, 0, 0)') {
            results.push({
              text: el.innerText.substring(0, 50),
              tag: el.tagName,
              className: el.className,
              bg: colors.bg,
              textColor: colors.text,
              fontSize: colors.fontSize,
            });
          }
        }
      });

      return results;
    });

    return contrastInfo;
  } catch (error) {
    console.error(`Error analyzing contrast on ${routeName}:`, error.message);
    return [];
  }
}

async function main() {
  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log('🔍 Starting Accessibility Audit with axe-core & Color Contrast Analysis\n');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Routes: ${ROUTES.length}\n`);

  const browser = await chromium.launch({ headless: true });
  const summaryData = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    routes: [],
  };

  try {
    for (const route of ROUTES) {
      const url = `${BASE_URL}${route.path}`;
      console.log(`\n📊 Scanning ${route.name} (${url})...`);

      const page = await browser.newPage();
      page.setViewportSize({ width: 375, height: 812 }); // Mobile-first viewport

      try {
        // Navigate to page
        await page.goto(url, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Try to inject axe
        const axeLoaded = await injectAxe(page);

        let axeResults = null;
        if (axeLoaded) {
          console.log('   Running axe-core audit...');
          axeResults = await runAxeAudit(page, route.name);
        } else {
          console.log('   ⚠️ Could not load axe-core (CDN blocked)');
        }

        // Analyze color contrast
        console.log('   Analyzing color contrast...');
        const contrastAnalysis = await analyzeColorContrast(page, route.name);

        // Collect page title and headings
        const pageTitle = await page.title();
        const h1s = await page.locator('h1').count();
        const buttons = await page.locator('button').count();
        const links = await page.locator('a').count();

        // Build route summary
        const routeSummary = {
          path: route.path,
          name: route.name,
          pageTitle: pageTitle,
          viewport: '375x812 (mobile)',
          elementCounts: {
            h1: h1s,
            buttons: buttons,
            links: links,
          },
        };

        // Add axe results if available
        if (axeResults) {
          routeSummary.axeResults = {
            violations: axeResults.violations.length,
            passes: axeResults.passes.length,
            incomplete: axeResults.incomplete.length,
            violationDetails: axeResults.violations.slice(0, 5).map(v => ({
              id: v.id,
              impact: v.impact,
              description: v.description,
              nodes: v.nodes.length,
            })),
          };
          console.log(`   ✅ axe audit: ${axeResults.violations.length} violations, ${axeResults.passes.length} passes`);
        } else {
          routeSummary.axeResults = { error: 'Could not run axe-core audit' };
        }

        // Add color samples
        if (contrastAnalysis.length > 0) {
          routeSummary.colorSamples = contrastAnalysis.slice(0, 5);
          console.log(`   📊 Sampled ${contrastAnalysis.length} text elements for contrast analysis`);
        }

        summaryData.routes.push(routeSummary);

      } catch (error) {
        console.error(`   ❌ Error scanning ${route.name}:`, error.message);
        summaryData.routes.push({
          path: route.path,
          name: route.name,
          error: error.message,
        });
      } finally {
        await page.close();
      }
    }

    // Save results
    const summaryPath = path.join(OUTPUT_DIR, 'accessibility-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summaryData, null, 2));
    console.log(`\n\n📄 Full results saved to: ${summaryPath}`);

    // Generate report
    generateReport(summaryData);

  } finally {
    await browser.close();
  }
}

function generateReport(data) {
  const lines = [
    '═══════════════════════════════════════════════════════════',
    'ACCESSIBILITY AUDIT REPORT',
    '═══════════════════════════════════════════════════════════',
    `Generated: ${new Date().toLocaleString()}`,
    `Base URL: ${data.baseUrl}`,
    `Viewport: Mobile-first (375x812)`,
    '',
    'SUMMARY BY ROUTE',
    '───────────────────────────────────────────────────────────',
  ];

  data.routes.forEach(route => {
    lines.push(`\n${route.name} (${route.path})`);
    if (route.error) {
      lines.push(`  ❌ Error: ${route.error}`);
      return;
    }

    lines.push(`  Page Title: ${route.pageTitle}`);
    if (route.elementCounts) {
      lines.push(`  Elements: ${route.elementCounts.h1} H1s, ${route.elementCounts.buttons} buttons, ${route.elementCounts.links} links`);
    }

    if (route.axeResults && !route.axeResults.error) {
      lines.push(`  axe-core Results:`);
      lines.push(`    • Violations: ${route.axeResults.violations}`);
      lines.push(`    • Passes: ${route.axeResults.passes}`);
      lines.push(`    • Incomplete: ${route.axeResults.incomplete}`);

      if (route.axeResults.violationDetails.length > 0) {
        lines.push(`  Top Issues:`);
        route.axeResults.violationDetails.forEach(v => {
          lines.push(`    • ${v.id} (${v.impact}) - ${v.nodes} node(s)`);
        });
      }
    }

    if (route.colorSamples && route.colorSamples.length > 0) {
      lines.push(`  Color Contrast Samples:`);
      route.colorSamples.forEach(sample => {
        lines.push(`    • "${sample.text.substring(0, 40)}..." (${sample.tag})`);
        lines.push(`      BG: ${sample.bg} | Text: ${sample.textColor}`);
      });
    }
  });

  const reportPath = path.join(OUTPUT_DIR, 'accessibility-report.txt');
  fs.writeFileSync(reportPath, lines.join('\n'));
  console.log(`📝 Report saved to: ${reportPath}`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
