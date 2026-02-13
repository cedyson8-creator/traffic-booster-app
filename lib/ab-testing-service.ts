import { ABTest, TestVariation, TestResult, ABTestMetrics } from './ab-testing-types';

/**
 * Calculate chi-square statistic for A/B test
 */
export function calculateChiSquare(
  variation1Conversions: number,
  variation1Visits: number,
  variation2Conversions: number,
  variation2Visits: number
): number {
  const rate1 = variation1Conversions / variation1Visits;
  const rate2 = variation2Conversions / variation2Visits;
  const pooledRate = (variation1Conversions + variation2Conversions) / (variation1Visits + variation2Visits);

  const expected1 = variation1Visits * pooledRate;
  const expected2 = variation2Visits * pooledRate;

  const chi2 =
    Math.pow(variation1Conversions - expected1, 2) / expected1 +
    Math.pow(variation2Conversions - expected2, 2) / expected2;

  return chi2;
}

/**
 * Convert chi-square to p-value (approximation)
 */
export function chiSquareToPValue(chiSquare: number): number {
  // Simplified p-value calculation for chi-square with 1 degree of freedom
  if (chiSquare < 0.455) return 0.5;
  if (chiSquare < 1.074) return 0.3;
  if (chiSquare < 2.706) return 0.1;
  if (chiSquare < 3.841) return 0.05;
  if (chiSquare < 5.024) return 0.025;
  if (chiSquare < 6.635) return 0.01;
  return 0.001;
}

/**
 * Calculate confidence level (1 - p-value)
 */
export function calculateConfidence(pValue: number): number {
  return Math.max(0, Math.min(100, (1 - pValue) * 100));
}

/**
 * Determine if test has statistical significance
 */
export function hasStatisticalSignificance(
  pValue: number,
  confidenceLevel: number = 0.95
): boolean {
  return pValue < 1 - confidenceLevel;
}

/**
 * Calculate sample size needed for statistical significance
 */
export function calculateRequiredSampleSize(
  baselineConversionRate: number,
  minimumDetectableEffect: number = 0.2, // 20% improvement
  confidenceLevel: number = 0.95,
  statisticalPower: number = 0.8
): number {
  // Simplified sample size calculation
  const zAlpha = confidenceLevel === 0.99 ? 2.576 : confidenceLevel === 0.95 ? 1.96 : 1.645;
  const zBeta = statisticalPower === 0.9 ? 1.282 : statisticalPower === 0.8 ? 0.842 : 0.674;

  const p1 = baselineConversionRate;
  const p2 = baselineConversionRate * (1 + minimumDetectableEffect);

  const sampleSize =
    Math.pow(zAlpha + zBeta, 2) *
    (p1 * (1 - p1) + p2 * (1 - p2)) /
    Math.pow(p2 - p1, 2);

  return Math.ceil(sampleSize);
}

/**
 * Analyze A/B test results
 */
export function analyzeABTest(test: ABTest): TestResult[] {
  if (test.variations.length < 2) {
    return [];
  }

  const results: TestResult[] = [];
  const baselineVariation = test.variations[0];

  for (let i = 1; i < test.variations.length; i++) {
    const testVariation = test.variations[i];

    const chiSquare = calculateChiSquare(
      baselineVariation.conversions,
      baselineVariation.visits,
      testVariation.conversions,
      testVariation.visits
    );

    const pValue = chiSquareToPValue(chiSquare);
    const confidence = calculateConfidence(pValue);
    const improvement =
      ((testVariation.conversionRate - baselineVariation.conversionRate) /
        baselineVariation.conversionRate) *
      100;

    const isSignificant = hasStatisticalSignificance(pValue, test.confidenceLevel);
    const isWinner = isSignificant && improvement > 0;

    let recommendation = '';
    if (isWinner) {
      recommendation = `${testVariation.name} is the winner with ${improvement.toFixed(1)}% improvement`;
    } else if (isSignificant && improvement < 0) {
      recommendation = `${testVariation.name} performs worse. Consider stopping this variation.`;
    } else if (testVariation.visits < test.minimumSampleSize) {
      recommendation = `Need more data. Current: ${testVariation.visits}, Required: ${test.minimumSampleSize}`;
    } else {
      recommendation = 'No clear winner yet. Continue testing.';
    }

    results.push({
      testId: test.id,
      variationId: testVariation.id,
      winner: isWinner,
      conversionRate: testVariation.conversionRate,
      confidence,
      pValue,
      improvement,
      recommendation,
    });
  }

  return results;
}

/**
 * Get A/B test metrics
 */
export function getABTestMetrics(test: ABTest): ABTestMetrics {
  const totalVisits = test.variations.reduce((sum, v) => sum + v.visits, 0);
  const totalConversions = test.variations.reduce((sum, v) => sum + v.conversions, 0);
  const overallConversionRate = totalVisits > 0 ? (totalConversions / totalVisits) * 100 : 0;

  const sortedByConversion = [...test.variations].sort(
    (a, b) => b.conversionRate - a.conversionRate
  );

  const bestVariation = sortedByConversion[0];
  const worstVariation = sortedByConversion[sortedByConversion.length - 1];

  const improvement =
    bestVariation && worstVariation
      ? ((bestVariation.conversionRate - worstVariation.conversionRate) /
          worstVariation.conversionRate) *
        100
      : 0;

  const results = analyzeABTest(test);
  const avgConfidence = results.length > 0
    ? results.reduce((sum, r) => sum + r.confidence, 0) / results.length
    : 0;

  let recommendedAction: 'continue' | 'stop' | 'declare_winner' | 'increase_sample' = 'continue';

  if (avgConfidence >= 95 && results.some((r) => r.winner)) {
    recommendedAction = 'declare_winner';
  } else if (totalVisits >= test.minimumSampleSize && avgConfidence < 80) {
    recommendedAction = 'stop';
  } else if (totalVisits < test.minimumSampleSize) {
    recommendedAction = 'increase_sample';
  }

  return {
    testId: test.id,
    totalVisits,
    totalConversions,
    overallConversionRate,
    bestVariation: {
      id: bestVariation.id,
      name: bestVariation.name,
      conversionRate: bestVariation.conversionRate,
      improvement,
    },
    worstVariation: {
      id: worstVariation.id,
      name: worstVariation.name,
      conversionRate: worstVariation.conversionRate,
    },
    statisticalSignificance: avgConfidence,
    recommendedAction,
  };
}

/**
 * Simulate test data for demonstration
 */
export function simulateTestData(test: ABTest): ABTest {
  const updatedVariations = test.variations.map((variation, index) => {
    // Simulate different conversion rates for each variation
    const baseRate = 0.02 + index * 0.005; // 2%, 2.5%, 3%, etc.
    const visits = Math.floor(Math.random() * 500) + 100;
    const conversions = Math.floor(visits * baseRate);

    return {
      ...variation,
      visits,
      conversions,
      conversionRate: (conversions / visits) * 100,
      revenue: conversions * 50, // $50 per conversion
    };
  });

  return {
    ...test,
    variations: updatedVariations,
  };
}

/**
 * Get winner recommendation
 */
export function getWinnerRecommendation(test: ABTest): string {
  const metrics = getABTestMetrics(test);

  if (metrics.recommendedAction === 'declare_winner') {
    return `${metrics.bestVariation.name} is the clear winner with ${metrics.bestVariation.improvement.toFixed(
      1
    )}% improvement. Recommend implementing this variation.`;
  } else if (metrics.recommendedAction === 'stop') {
    return 'Test has reached sample size but no clear winner. Consider stopping and trying different variations.';
  } else if (metrics.recommendedAction === 'increase_sample') {
    return `Continue testing. Need more data for statistical significance. Current confidence: ${metrics.statisticalSignificance.toFixed(
      1
    )}%`;
  }

  return 'Test is ongoing. Continue monitoring results.';
}
