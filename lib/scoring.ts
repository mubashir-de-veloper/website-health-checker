import { Check } from "./checks";

export interface CategoryScores {
  seo: number;
  technical: number;
  content: number;
  overall: number;
}

function calculateCategoryScore(
  checks: Check[],
  category: Check["category"]
): number {
  const categoryChecks = checks.filter(
    (check) => check.category === category
  );

  const earned = categoryChecks.reduce(
    (total, check) => total + check.points,
    0
  );

  const possible = categoryChecks.reduce(
    (total, check) => total + check.maxPoints,
    0
  );

  if (possible === 0) {
    return 0;
  }

  return Math.round((earned / possible) * 100);
}

export function calculateScores(
  checks: Check[]
): CategoryScores {
  const seo = calculateCategoryScore(
    checks,
    "seo"
  );

  const technical = calculateCategoryScore(
    checks,
    "technical"
  );

  const content = calculateCategoryScore(
    checks,
    "content"
  );

  const overall = Math.round(
    (seo + technical + content) / 3
  );

  return {
    seo,
    technical,
    content,
    overall
  };
}