import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { estimateCostUsd } from './pricing.js';

/**
 * Walk Claude Code project logs under ~/.claude/projects and sum tokens.
 * Claude stores JSONL session files with usage fields in many builds.
 */
async function walkFiles(dir, out = []) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      await walkFiles(full, out);
    } else if (ent.isFile() && (ent.name.endsWith('.jsonl') || ent.name.endsWith('.json'))) {
      out.push(full);
    }
  }
  return out;
}

function extractUsageFromLine(line) {
  try {
    const obj = JSON.parse(line);
    // Common shapes across Claude Code / agent logs
    const usage =
      obj.usage ||
      obj.message?.usage ||
      obj.message?.message?.usage ||
      obj.tokenUsage ||
      null;
    if (!usage) return null;
    const input =
      Number(usage.input_tokens ?? usage.inputTokens ?? usage.prompt_tokens ?? 0) || 0;
    const output =
      Number(usage.output_tokens ?? usage.outputTokens ?? usage.completion_tokens ?? 0) || 0;
    if (!input && !output) return null;
    const model =
      obj.model ||
      obj.message?.model ||
      obj.message?.message?.model ||
      usage.model ||
      'unknown';
    return { input, output, model };
  } catch {
    return null;
  }
}

export async function scanClaudeLogs(root = path.join(os.homedir(), '.claude', 'projects')) {
  const files = await walkFiles(root);
  const byModel = new Map();
  let sessions = 0;

  for (const file of files) {
    let text;
    try {
      text = await fs.readFile(file, 'utf8');
    } catch {
      continue;
    }
    let hit = false;
    for (const line of text.split('\n')) {
      if (!line.trim()) continue;
      const u = extractUsageFromLine(line);
      if (!u) continue;
      hit = true;
      const prev = byModel.get(u.model) || { input: 0, output: 0, requests: 0 };
      prev.input += u.input;
      prev.output += u.output;
      prev.requests += 1;
      byModel.set(u.model, prev);
    }
    if (hit) sessions += 1;
  }

  return { byModel, sessions, filesScanned: files.length, root };
}

export function summarize(scanResult, planKey = 'solo') {
  let input = 0;
  let output = 0;
  let requests = 0;
  let directUsd = 0;
  const models = [];

  for (const [model, stats] of scanResult.byModel.entries()) {
    const cost = estimateCostUsd({
      inputTokens: stats.input,
      outputTokens: stats.output,
      model,
    });
    input += stats.input;
    output += stats.output;
    requests += stats.requests;
    directUsd += cost;
    models.push({ model, ...stats, estimatedDirectUsd: cost });
  }

  models.sort((a, b) => b.estimatedDirectUsd - a.estimatedDirectUsd);

  return {
    inputTokens: input,
    outputTokens: output,
    totalTokens: input + output,
    requests,
    sessions: scanResult.sessions,
    filesScanned: scanResult.filesScanned,
    estimatedDirectUsd: directUsd,
    models,
    root: scanResult.root,
  };
}
