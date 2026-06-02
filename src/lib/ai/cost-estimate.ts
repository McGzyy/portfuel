/** Rough USD per 1M tokens (input, output) — override via env if needed. */
const PRICING: Record<string, { input: number; output: number }> = {
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4o": { input: 2.5, output: 10 },
};

export function charsToTokenEstimate(chars: number): number {
  return Math.ceil(chars / 4);
}

export function estimateCostUsd(
  modelId: string,
  inputChars: number,
  outputChars: number
): number {
  const rates = PRICING[modelId] ?? PRICING["gpt-4o-mini"]!;
  const inTok = charsToTokenEstimate(inputChars);
  const outTok = charsToTokenEstimate(outputChars);
  const usd =
    (inTok / 1_000_000) * rates.input + (outTok / 1_000_000) * rates.output;
  return Math.round(usd * 10000) / 10000;
}

export type AnalysisCostMetrics = {
  modelId: string;
  promptChars: number;
  outputChars: number;
  promptTokensEstimate: number;
  outputTokensEstimate: number;
  estimatedCostUsd: number;
};

export function buildCostMetrics(
  modelId: string,
  promptChars: number,
  outputChars: number
): AnalysisCostMetrics {
  return {
    modelId,
    promptChars,
    outputChars,
    promptTokensEstimate: charsToTokenEstimate(promptChars),
    outputTokensEstimate: charsToTokenEstimate(outputChars),
    estimatedCostUsd: estimateCostUsd(modelId, promptChars, outputChars),
  };
}

export function sumCostMetrics(metrics: AnalysisCostMetrics[]): AnalysisCostMetrics {
  if (metrics.length === 0) {
    return buildCostMetrics("gpt-4o-mini", 0, 0);
  }
  return {
    modelId: metrics.map((m) => m.modelId).join(" + "),
    promptChars: metrics.reduce((a, m) => a + m.promptChars, 0),
    outputChars: metrics.reduce((a, m) => a + m.outputChars, 0),
    promptTokensEstimate: metrics.reduce((a, m) => a + m.promptTokensEstimate, 0),
    outputTokensEstimate: metrics.reduce((a, m) => a + m.outputTokensEstimate, 0),
    estimatedCostUsd: Math.round(metrics.reduce((a, m) => a + m.estimatedCostUsd, 0) * 10000) / 10000,
  };
}
