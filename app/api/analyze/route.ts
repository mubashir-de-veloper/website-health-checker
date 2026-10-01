import * as cheerio from "cheerio";
import dns from "node:dns/promises";
import net from "node:net";

import { calculateScores } from "@/lib/scoring";
import { AnalysisResult } from "@/lib/types";

import { runChecks } from "@/lib/checks";

import {
  generateRecommendations
} from "@/lib/recommendations";

//export const maxDuration = 15;

function isPrivateIp(ip: string): boolean {
  const version = net.isIP(ip);

  if (version === 4) {
    const parts = ip.split(".").map(Number);

    const [a, b] = parts;

    return (
      a === 10 ||
      a === 127 ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 169 && b === 254) ||
      a === 0
    );
  }

  if (version === 6) {
    const normalized = ip.toLowerCase();

    return (
      normalized === "::1" ||
      normalized === "::" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      normalized.startsWith("fe80:")
    );
  }

  return false;
}

async function isSafeUrl(url: URL): Promise<boolean> {
  const hostname = url.hostname.toLowerCase();

  const blockedHostnames = [
    "localhost",
    "localhost.localdomain",
    "metadata.google.internal",
    "metadata.google",
  ];

  if (blockedHostnames.includes(hostname)) {
    return false;
  }

  if (net.isIP(hostname)) {
    return !isPrivateIp(hostname);
  }

  try {
    const addresses = await dns.lookup(hostname, {
      all: true,
    });

    return addresses.every(
      ({ address }) => !isPrivateIp(address)
    );
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    // 1. Get URL from request
    const body = await request.json();
    const url = body.url;

    if (!url || typeof url !== "string") {
      return Response.json(
        { error: "URL is required." },
        { status: 400 }
      );
    }

    // 2. Validate URL
    let parsedUrl: URL;

    try {
      parsedUrl = new URL(url);
    } catch {
      return Response.json(
        { error: "Invalid URL." },
        { status: 400 }
      );
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return Response.json(
        { error: "Only HTTP and HTTPS URLs are allowed." },
        { status: 400 }
      );
    }

    const safeUrl = await isSafeUrl(parsedUrl);

    if (!safeUrl) {
      return Response.json(
        {
          error: "This URL cannot be analyzed."
        },
        { status: 400 }
      );
    }

    // 3. Fetch website
    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, 150000);

    let response: Response;

    try {
      response = await fetch(parsedUrl.toString(), {
        headers: {
          "User-Agent": "WebsiteHealthChecker/1.0"
        },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      return Response.json(
        {
          error: `Website returned HTTP ${response.status}.`
        },
        { status: 400 }
      );
    }

    // 4. Get HTML
    const html = await response.text();

    // 5. Load HTML with Cheerio
    const $ = cheerio.load(html);

    // -------------------------
    // SEO
    // -------------------------

    const title = $("title").first().text().trim() || null;

    const metaDescription =
      $('meta[name="description"]')
        .attr("content")
        ?.trim() || null;

    const canonical =
      $('link[rel="canonical"]')
        .attr("href")
        ?.trim() || null;

    // -------------------------
    // HEADINGS
    // -------------------------

    const h1s = $("h1")
      .map((_, element) => $(element).text().trim())
      .get();

    const headings = {
      h1: h1s,
      h2: $("h2").length,
      h3: $("h3").length,
      h4: $("h4").length,
      h5: $("h5").length,
      h6: $("h6").length
    };

    // -------------------------
    // IMAGES
    // -------------------------

    const imageElements = $("img");

    const imagesTotal = imageElements.length;

    const imagesWithoutAlt = imageElements.filter(
      (_, element) => !$(element).attr("alt")
    ).length;

    // -------------------------
    // MOBILE VIEWPORT
    // -------------------------

    const viewport =
      $('meta[name="viewport"]')
        .attr("content")
        ?.trim() || null;

    // -------------------------
    // HTML LANGUAGE
    // -------------------------

    const language =
      $("html").attr("lang") || null;

    // -------------------------
    // OPEN GRAPH
    // -------------------------

    const openGraph = {
      title:
        $('meta[property="og:title"]')
          .attr("content") || null,

      description:
        $('meta[property="og:description"]')
          .attr("content") || null,

      image:
        $('meta[property="og:image"]')
          .attr("content") || null,

      url:
        $('meta[property="og:url"]')
          .attr("content") || null
    };

    // -------------------------
    // CONTENT
    // -------------------------

    const bodyText = $("body")
      .text()
      .replace(/\s+/g, " ")
      .trim();

    const wordCount = bodyText
      ? bodyText.split(/\s+/).length
      : 0;

    // -------------------------
    // RESULT
    // -------------------------

    const analysis: AnalysisResult = {
      success: true,
    
      url: parsedUrl.toString(),
    
      seo: {
        title,
        titleLength: title?.length || 0,
        metaDescription,
        metaDescriptionLength:
          metaDescription?.length || 0,
        canonical,
        openGraph
      },
    
      technical: {
        https: parsedUrl.protocol === "https:",
        viewport,
        language
      },
    
      headings,
    
      images: {
        total: imagesTotal,
        withoutAlt: imagesWithoutAlt
      },
    
      content: {
        wordCount
      }
    };
    
    const checks = runChecks(analysis);
    const scores = calculateScores(checks);
    
    const recommendations = generateRecommendations(checks);
    
    return Response.json({
      ...analysis,
      checks,
      scores,
      recommendations
    });

  } catch (error) {
    console.error("Analysis error:", error);

    return Response.json(
      {
        error: "Unable to analyze this website."
      },
      { status: 500 }
    );
  }
}