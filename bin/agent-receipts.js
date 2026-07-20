#!/usr/bin/env node
import { scanClaudeLogs, summarize } from '../lib/scan.js';
import { FLAT_PLANS } from '../lib/pricing.js';

function parseArgs(argv) {
  const args = { plan: 'solo', json: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json') args.json = true;
    else if (a === '--plan' && argv[i + 1]) {
      args.plan = argv[++i];
    } else if (a === '--help' || a === '-h') {
      args.help = true;
    }
  }
  return args;
}

function fmtUsd(n) {
  return `$${n.toFixed(2)}`;
}

function fmtTokens(n) {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}k`;
  return String(n);
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log(`agent-receipts — local cost receipts for coding agents

Usage:
  npx agent-receipts
  npx agent-receipts --plan growth
  npx agent-receipts --json

Scans ~/.claude/projects for usage logs (local only, nothing uploaded).
Compares estimated Anthropic direct spend vs flat-rate gateway plans.
`);
    process.exit(0);
  }

  const plan = FLAT_PLANS[args.plan] || FLAT_PLANS.solo;
  const scan = await scanClaudeLogs();
  const summary = summarize(scan, args.plan);

  if (args.json) {
    console.log(JSON.stringify({ plan, summary }, null, 2));
    return;
  }

  console.log('');
  console.log('  agent-receipts');
  console.log('  ──────────────');
  console.log(`  scanned:  ${summary.filesScanned} files · ${summary.sessions} sessions`);
  console.log(`  tokens:   ${fmtTokens(summary.totalTokens)}  (${fmtTokens(summary.inputTokens)} in / ${fmtTokens(summary.outputTokens)} out)`);
  console.log(`  requests: ${summary.requests}`);
  console.log('');
  console.log(`  Anthropic direct (est.):  ${fmtUsd(summary.estimatedDirectUsd)}`);
  console.log(`  ${plan.name} flat:         ${fmtUsd(plan.monthlyUsd)} / month`);
  const saved = summary.estimatedDirectUsd - plan.monthlyUsd;
  if (summary.estimatedDirectUsd > 0) {
    const mult = summary.estimatedDirectUsd / plan.monthlyUsd;
    console.log(`  difference:              ${fmtUsd(saved)}  (${mult.toFixed(1)}× vs flat)`);
  } else {
    console.log('  No usage logs found yet. Run Claude Code a bit, then re-run.');
  }
  console.log('');
  if (summary.models.length) {
    console.log('  Top models by estimated direct cost:');
    for (const m of summary.models.slice(0, 8)) {
      console.log(
        `    · ${m.model.padEnd(28)} ${fmtTokens(m.input + m.output).padStart(8)} tok  ${fmtUsd(m.estimatedDirectUsd)}`,
      );
    }
    console.log('');
  }
  console.log('  Flat-rate option: https://piramyd.cloud  ·  npx piramyd');
  console.log('  (local-only tool · estimates · not official billing)');
  console.log('');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
