#!/usr/bin/env node

import lighthouse from 'lighthouse';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

// Simple delay function
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runLighthouseAudit(url, routeName) {
  try {
    console.log(`\n📊 Scanning ${routeName} (${url})...`);

    const options = {
      logLevel: 'error',
      output: 'json',
      onlyCategories: ['accessibility'],
      port: 0, // Use any available port
    };

    const runnerResult = await lighthouse(url, options);

    if (!runnerResult) {
      console.warn(`⚠️ No results for ${routeName}`);
      return null;
    }

    const lhr = runnerResult.lhr;

    return {
      route: url,
      name: routeName,
      score: (lhr.categories.accessibility.score * 100).toFixed(1),
      audits: lhr.audits,
    };
  } catch (error) {
    console.error(`❌ Error scanning ${routeName}:`, error.message);
    return null;
  }
}

async function extractViolations(auditResults) {
  const violations = [];

  for (const [auditId, audit] of Object.entries(auditResults.audits)) {
    if (audit.score === 0 && audit.details?.items) {
      violations.push({
        id: auditId,
        title: audit.title,
        description: audit.description,
        itemCount: audit.details.items.length,
        severity: audit.impact || 'unknown',
      });
    }
  }

  return violations.sort((a, b) => b.itemCount - a.itemCount);
}

async function main() {
  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log('🔍 Starting Accessibility Audit...\n');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Routes: ${ROUTES.length}`);
  console.log('Note: Using Lighthouse API (no separate Chrome process needed)\n');

  const allResults = [];
  const summaryData = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    routes: [],
  };

  try {
    // Run audits for each route
    for (const route of ROUTES) {
      const url = `${BASE_URL}${route.path}`;
      const result = await runLighthouseAudit(url, route.name);

      if (result) {
        allResults.push(result);

        // Extract violations
        const violations = await extractViolations(result);

        summaryData.routes.push({
          path: route.path,
          name: route.name,
          score: parseFloat(result.score),
          violationCount: violations.length,
          violations: violations.map(v => ({
            id: v.id,
            title: v.title,
            itemCount: v.itemCount,
            severity: v.severity,
          })),
        });

        console.log(`✅ ${route.name}: Score ${result.score}/100`);
        if (violations.length > 0) {
          console.log(`   Found ${violations.length} accessibility issues:`);
          violations.slice(0, 3).forEach(v => {
            console.log(`   - ${v.title} (${v.itemCount} items)`);
          });
        }
      }

      // Small delay between audits to avoid overwhelming the server
      await delay(1000);
    }

    // Save results
    const summaryPath = path.join(OUTPUT_DIR, 'accessibility-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summaryData, null, 2));
    console.log(`\n📄 Summary saved to: ${summaryPath}`);

    // Generate text report
    const reportPath = path.join(OUTPUT_DIR, 'accessibility-report.txt');
    generateTextReport(summaryData, reportPath);
    console.log(`📝 Report saved to: ${reportPath}`);

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }

  return summaryData;
}

function generateTextReport(data, filepath) {
  const lines = [
    '═══════════════════════════════════════════════════════════',
    'ACCESSIBILITY AUDIT REPORT',
    '═══════════════════════════════════════════════════════════',
    `Generated: ${new Date().toLocaleString()}`,
    `Base URL: ${data.baseUrl}`,
    '',
    'SUMMARY BY ROUTE',
    '───────────────────────────────────────────────────────────',
  ];

  // Add summary table
  data.routes.forEach(route => {
    lines.push(`\n${route.name} (${route.path})`);
    lines.push(`  Accessibility Score: ${route.score.toFixed(1)}/100`);
    lines.push(`  Issues Found: ${route.violationCount}`);

    if (route.violations.length > 0) {
      lines.push(`  Top Issues:`);
      route.violations.forEach(v => {
        lines.push(`    • ${v.title} (${v.itemCount} items)`);
      });
    }
  });

  // Add overall stats
  lines.push('');
  lines.push('═══════════════════════════════════════════════════════════');
  lines.push('OVERALL STATISTICS');
  lines.push('───────────────────────────────────────────────────────────');

  const avgScore = (data.routes.reduce((sum, r) => sum + r.score, 0) / data.routes.length).toFixed(1);
  const totalIssues = data.routes.reduce((sum, r) => sum + r.violationCount, 0);

  lines.push(`Average Score: ${avgScore}/100`);
  lines.push(`Total Routes Scanned: ${data.routes.length}`);
  lines.push(`Total Issues Found: ${totalIssues}`);

  fs.writeFileSync(filepath, lines.join('\n'));
}

main().catch(console.error);
