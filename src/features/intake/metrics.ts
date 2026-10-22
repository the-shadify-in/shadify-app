/**
 * Internal operational metrics for AI Intake Assistant.
 * Strictly no personal data, no names, no raw text stored.
 */

export interface IntakeOperationalMetrics {
  attempts: number;
  successes: number;
  parseFailures: number;
  latencies: number[];
  totalCostInr: number;
  fieldEditRates: {
    high: { total: number; edited: number };
    medium: { total: number; edited: number };
    low: { total: number; edited: number };
  };
}

class IntakeMetricsStore {
  private metrics: IntakeOperationalMetrics = {
    attempts: 0,
    successes: 0,
    parseFailures: 0,
    latencies: [],
    totalCostInr: 0,
    fieldEditRates: {
      high: { total: 0, edited: 0 },
      medium: { total: 0, edited: 0 },
      low: { total: 0, edited: 0 },
    },
  };

  recordAttempt(): void {
    this.metrics.attempts++;
  }

  recordSuccess(durationMs: number, costEstimateInr = 0.2): void {
    this.metrics.successes++;
    this.metrics.latencies.push(durationMs);
    // Keep last 1000 latencies for rolling median
    if (this.metrics.latencies.length > 1000) {
      this.metrics.latencies.shift();
    }
    this.metrics.totalCostInr += costEstimateInr;
  }

  recordParseFailure(): void {
    this.metrics.parseFailures++;
  }

  recordFieldReview(confidence: "high" | "medium" | "low", wasEdited: boolean): void {
    if (this.metrics.fieldEditRates[confidence]) {
      this.metrics.fieldEditRates[confidence].total++;
      if (wasEdited) {
        this.metrics.fieldEditRates[confidence].edited++;
      }
    }
  }

  getSnapshot(): IntakeOperationalMetrics & { medianLatencyMs: number } {
    const sorted = [...this.metrics.latencies].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const valMid = sorted[mid] ?? 0;
    const valPrev = sorted[mid - 1] ?? valMid;
    const medianLatencyMs =
      sorted.length === 0
        ? 0
        : sorted.length % 2 !== 0
          ? valMid
          : Math.round((valPrev + valMid) / 2);

    return {
      ...this.metrics,
      medianLatencyMs,
    };
  }

  reset(): void {
    this.metrics = {
      attempts: 0,
      successes: 0,
      parseFailures: 0,
      latencies: [],
      totalCostInr: 0,
      fieldEditRates: {
        high: { total: 0, edited: 0 },
        medium: { total: 0, edited: 0 },
        low: { total: 0, edited: 0 },
      },
    };
  }
}

export const intakeMetrics = new IntakeMetricsStore();
