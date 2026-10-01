import { AnalysisResult } from "./types";

export type CheckStatus = "pass" | "warning" | "fail";

export interface Check {
  id: string;
  category: "seo" | "technical" | "content";
  name: string;
  status: CheckStatus;
  message: string;
  points: number;
  maxPoints: number;
}

export function runChecks(
  analysis: AnalysisResult
): Check[] {
  const checks: Check[] = [];

  // ==========================================
  // SEO CHECKS
  // ==========================================

  // Page Title
  if (!analysis.seo.title) {
    checks.push({
      id: "title-exists",
      category: "seo",
      name: "Page title",
      status: "fail",
      message: "No page title was found.",
      points: 0,
      maxPoints: 10
    });
  } else {
    checks.push({
      id: "title-exists",
      category: "seo",
      name: "Page title",
      status: "pass",
      message: "A page title was found.",
      points: 10,
      maxPoints: 10
    });
  }

  // Title Length
  if (
    analysis.seo.titleLength >= 30 &&
    analysis.seo.titleLength <= 60
  ) {
    checks.push({
      id: "title-length",
      category: "seo",
      name: "Title length",
      status: "pass",
      message: `Title is ${analysis.seo.titleLength} characters long.`,
      points: 5,
      maxPoints: 5
    });
  } else if (analysis.seo.title) {
    checks.push({
      id: "title-length",
      category: "seo",
      name: "Title length",
      status: "warning",
      message: `Title is ${analysis.seo.titleLength} characters long. Aim for roughly 30–60 characters.`,
      points: 0,
      maxPoints: 5
    });
  } else {
    checks.push({
      id: "title-length",
      category: "seo",
      name: "Title length",
      status: "fail",
      message: "Cannot evaluate title length because no title exists.",
      points: 0,
      maxPoints: 5
    });
  }

  // Meta Description
  if (!analysis.seo.metaDescription) {
    checks.push({
      id: "meta-description",
      category: "seo",
      name: "Meta description",
      status: "fail",
      message: "No meta description was found.",
      points: 0,
      maxPoints: 10
    });
  } else {
    checks.push({
      id: "meta-description",
      category: "seo",
      name: "Meta description",
      status: "pass",
      message: "A meta description was found.",
      points: 10,
      maxPoints: 10
    });
  }

  // Meta Description Length
  if (
    analysis.seo.metaDescriptionLength >= 120 &&
    analysis.seo.metaDescriptionLength <= 160
  ) {
    checks.push({
      id: "meta-description-length",
      category: "seo",
      name: "Meta description length",
      status: "pass",
      message: `Meta description is ${analysis.seo.metaDescriptionLength} characters long.`,
      points: 5,
      maxPoints: 5
    });
  } else if (analysis.seo.metaDescription) {
    checks.push({
      id: "meta-description-length",
      category: "seo",
      name: "Meta description length",
      status: "warning",
      message: `Meta description is ${analysis.seo.metaDescriptionLength} characters long.`,
      points: 0,
      maxPoints: 5
    });
  } else {
    checks.push({
      id: "meta-description-length",
      category: "seo",
      name: "Meta description length",
      status: "fail",
      message: "No meta description to evaluate.",
      points: 0,
      maxPoints: 5
    });
  }

  // Canonical
  checks.push({
    id: "canonical",
    category: "seo",
    name: "Canonical URL",
    status: analysis.seo.canonical ? "pass" : "fail",
    message: analysis.seo.canonical
      ? "A canonical URL was found."
      : "No canonical URL was found.",
    points: analysis.seo.canonical ? 5 : 0,
    maxPoints: 5
  });

  // Open Graph
  const og = analysis.seo.openGraph;

  const ogCount = [
    og.title,
    og.description,
    og.image,
    og.url
  ].filter(Boolean).length;

  checks.push({
    id: "open-graph",
    category: "seo",
    name: "Open Graph tags",
    status:
      ogCount === 4
        ? "pass"
        : ogCount > 0
        ? "warning"
        : "fail",
    message: `${ogCount}/4 recommended Open Graph tags found.`,
    points: ogCount === 4 ? 5 : 0,
    maxPoints: 5
  });

  // ==========================================
  // TECHNICAL CHECKS
  // ==========================================

  // HTTPS
  checks.push({
    id: "https",
    category: "technical",
    name: "HTTPS",
    status: analysis.technical.https ? "pass" : "fail",
    message: analysis.technical.https
      ? "The website uses HTTPS."
      : "The website does not use HTTPS.",
    points: analysis.technical.https ? 5 : 0,
    maxPoints: 5
  });

  // Viewport
  checks.push({
    id: "viewport",
    category: "technical",
    name: "Mobile viewport",
    status: analysis.technical.viewport
      ? "pass"
      : "fail",
    message: analysis.technical.viewport
      ? "A mobile viewport tag was found."
      : "No mobile viewport tag was found.",
    points: analysis.technical.viewport ? 10 : 0,
    maxPoints: 10
  });

  // Language
  checks.push({
    id: "language",
    category: "technical",
    name: "HTML language",
    status: analysis.technical.language
      ? "pass"
      : "warning",
    message: analysis.technical.language
      ? `HTML language is set to "${analysis.technical.language}".`
      : "No HTML language attribute was found.",
    points: analysis.technical.language ? 5 : 0,
    maxPoints: 5
  });

  // Image Alt Text
  const imagesWithoutAlt = analysis.images.withoutAlt;

  checks.push({
    id: "image-alt",
    category: "technical",
    name: "Image alt text",
    status:
      imagesWithoutAlt === 0
        ? "pass"
        : "warning",
    message:
      analysis.images.total === 0
        ? "No images were found."
        : imagesWithoutAlt === 0
        ? "All images have alt attributes."
        : `${imagesWithoutAlt} image(s) are missing alt attributes.`,
    points:
      analysis.images.total === 0
        ? 10
        : imagesWithoutAlt === 0
        ? 10
        : Math.round(
            10 *
              (1 -
                imagesWithoutAlt /
                  analysis.images.total)
          ),
    maxPoints: 10
  });

  // ==========================================
  // CONTENT CHECKS
  // ==========================================

  // H1
  const h1Count = analysis.headings.h1.length;

  checks.push({
    id: "h1",
    category: "content",
    name: "H1 heading",
    status:
      h1Count === 1
        ? "pass"
        : h1Count === 0
        ? "fail"
        : "warning",
    message:
      h1Count === 0
        ? "No H1 heading was found."
        : h1Count === 1
        ? "Exactly one H1 heading was found."
        : `${h1Count} H1 headings were found.`,
    points: h1Count === 1 ? 5 : 0,
    maxPoints: 5
  });

  // Content Length
  const wordCount = analysis.content.wordCount;

  checks.push({
    id: "content-length",
    category: "content",
    name: "Content length",
    status:
      wordCount >= 300
        ? "pass"
        : wordCount >= 100
        ? "warning"
        : "fail",
    message: `Approximately ${wordCount} words were found on the page.`,
    points:
      wordCount >= 300
        ? 10
        : wordCount >= 100
        ? 5
        : 0,
    maxPoints: 10
  });

  // Subheadings
  const hasSubheadings =
    analysis.headings.h2 > 0 ||
    analysis.headings.h3 > 0;

  checks.push({
    id: "subheadings",
    category: "content",
    name: "Subheadings",
    status: hasSubheadings ? "pass" : "warning",
    message: hasSubheadings
      ? "The page uses subheadings."
      : "No H2 or H3 subheadings were found.",
    points: hasSubheadings ? 10 : 0,
    maxPoints: 10
  });

  return checks;
}