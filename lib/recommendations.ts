import { Check } from "./checks";

export interface Recommendation {
  id: string;
  priority: "high" | "medium";
  title: string;
  description: string;
}

const recommendationMap: Record<
  string,
  Recommendation
> = {
  "title-exists": {
    id: "title-exists",
    priority: "high",
    title: "Add a page title",
    description:
      "Add a unique and descriptive title that clearly explains what this page is about."
  },

  "title-length": {
    id: "title-length",
    priority: "medium",
    title: "Improve your page title length",
    description:
      "Aim for a concise page title of roughly 30–60 characters that clearly describes the page."
  },

  "meta-description": {
    id: "meta-description",
    priority: "high",
    title: "Add a meta description",
    description:
      "Add a unique meta description that summarizes the page and gives search users a reason to visit."
  },

  "meta-description-length": {
    id: "meta-description-length",
    priority: "medium",
    title: "Improve your meta description length",
    description:
      "Consider keeping the meta description around 120–160 characters so it can communicate the page topic clearly."
  },

  canonical: {
    id: "canonical",
    priority: "medium",
    title: "Add a canonical URL",
    description:
      "Add a canonical link element to identify the preferred URL for this page."
  },

  "open-graph": {
    id: "open-graph",
    priority: "medium",
    title: "Complete your Open Graph tags",
    description:
      "Add the recommended Open Graph title, description, image and URL tags to improve how the page appears when shared."
  },

  https: {
    id: "https",
    priority: "high",
    title: "Enable HTTPS",
    description:
      "Serve your website over HTTPS to protect connections between visitors and your website."
  },

  viewport: {
    id: "viewport",
    priority: "high",
    title: "Add a mobile viewport",
    description:
      'Add a viewport meta tag such as width=device-width, initial-scale=1 so browsers can render the page correctly on mobile devices.'
  },

  language: {
    id: "language",
    priority: "medium",
    title: "Set the HTML language",
    description:
      'Add a lang attribute to the HTML element, such as <html lang="en">, to identify the primary language of the page.'
  },

  "image-alt": {
    id: "image-alt",
    priority: "medium",
    title: "Add missing image alt text",
    description:
      "Add meaningful alt text to informative images. Decorative images can use an empty alt attribute."
  },

  h1: {
    id: "h1",
    priority: "high",
    title: "Improve your H1 heading",
    description:
      "Use one clear H1 heading that describes the main topic of the page."
  },

  "content-length": {
    id: "content-length",
    priority: "medium",
    title: "Add more useful page content",
    description:
      "Consider adding more useful, relevant content where appropriate so visitors can better understand the page."
  },

  subheadings: {
    id: "subheadings",
    priority: "medium",
    title: "Improve heading structure",
    description:
      "Use relevant H2 and H3 headings to organize longer content into clear sections."
  }
};

export function generateRecommendations(
  checks: Check[]
): Recommendation[] {
  const failedChecks = checks.filter(
    (check) =>
      check.status === "fail" ||
      check.status === "warning"
  );

  const recommendations = failedChecks
    .map((check) => recommendationMap[check.id])
    .filter(
      (
        recommendation
      ): recommendation is Recommendation =>
        Boolean(recommendation)
    );

  // High-priority recommendations first
  recommendations.sort((a, b) => {
    if (
      a.priority === "high" &&
      b.priority !== "high"
    ) {
      return -1;
    }

    if (
      a.priority !== "high" &&
      b.priority === "high"
    ) {
      return 1;
    }

    return 0;
  });

  // Return maximum 5 recommendations
  return recommendations.slice(0, 5);
}