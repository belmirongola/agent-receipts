/**
 * Approximate public Anthropic/OpenAI list prices (USD per 1M tokens).
 * Update when vendors change pricing. Used only for local estimates.
 */
export const MODEL_PRICES = {
  // Claude family (approximate 2026 list)
  'claude-opus-4': { input: 15, output: 75 },
  'claude-opus-4-6': { input: 15, output: 75 },
  'claude-opus-4.6': { input: 15, output: 75 },
  'claude-opus-4-8': { input: 15, output: 75 },
  'claude-opus-4.8': { input: 15, output: 75 },
  'claude-sonnet-4': { input: 3, output: 15 },
  'claude-sonnet-4-5': { input: 3, output: 15 },
  'claude-haiku-4-5': { input: 1, output: 5 },
  'claude-3-5-sonnet': { input: 3, output: 15 },
  'claude-3-5-haiku': { input: 0.8, output: 4 },
  // OpenAI / Codex family (approximate)
  'gpt-5': { input: 5, output: 15 },
  'gpt-5.4': { input: 5, output: 15 },
  'gpt-5.4-codex': { input: 5, output: 15 },
  'gpt-4o': { input: 2.5, output: 10 },
  'o3': { input: 10, output: 40 },
  'o4-mini': { input: 1.1, output: 4.4 },
};

export const DEFAULT_PRICE = { input: 5, output: 15 };

/** Flat-rate gateway comparison defaults (Piramyd Solo). */
export const FLAT_PLANS = {
  solo: { name: 'Piramyd Solo', monthlyUsd: 30 },
  growth: { name: 'Piramyd Growth', monthlyUsd: 50 },
};

export function resolvePrice(model) {
  if (!model) return DEFAULT_PRICE;
  const key = String(model).toLowerCase();
  for (const [name, price] of Object.entries(MODEL_PRICES)) {
    if (key.includes(name.toLowerCase()) || name.toLowerCase().includes(key)) {
      return price;
    }
  }
  // Heuristics
  if (key.includes('opus')) return MODEL_PRICES['claude-opus-4'];
  if (key.includes('sonnet')) return MODEL_PRICES['claude-sonnet-4'];
  if (key.includes('haiku')) return MODEL_PRICES['claude-haiku-4-5'];
  if (key.includes('codex') || key.includes('gpt-5')) return MODEL_PRICES['gpt-5.4'];
  return DEFAULT_PRICE;
}

export function estimateCostUsd({ inputTokens = 0, outputTokens = 0, model }) {
  const p = resolvePrice(model);
  return (inputTokens / 1e6) * p.input + (outputTokens / 1e6) * p.output;
}
