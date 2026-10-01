# Website Health Checker

A free automated website health checker built with Next.js. It analyzes a website's SEO, technical, and content health and generates a simple score with actionable recommendations.

## Features

- Analyze any public HTTP/HTTPS website
- SEO checks:
  - Page title
  - Meta description
  - Canonical URL
  - Open Graph tags
- Technical checks:
  - HTTPS
  - Mobile viewport
  - HTML language
  - Image alt text
- Content checks:
  - H1 heading
  - Heading structure
  - Basic content length
- Overall and category scores
- Rule-based recommendations
- Responsive interface
- URL validation and basic SSRF protection
- No database, AI API, or paid service required

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Cheerio
- Vercel
- GitHub

## Project Structure

app/
├── api/
│   └── analyze/
│       └── route.ts
├── layout.tsx
└── page.tsx

lib/
├── checks.ts
├── recommendations.ts
├── scoring.ts
└── types.ts

## Architecture

        ```text
            User enters URL
                ↓
            Next.js Frontend
                ↓
            POST /api/analyze
                ↓
            URL validation & security checks
                ↓
            Fetch website HTML
                ↓
            Cheerio HTML parsing
                ↓
            AnalysisResult
                ↓
            runChecks()
                ↓
┌───────────────┬───────────────┐
│               │               │
Scores     Recommendations    Report
│               │               │
└───────────────┴───────────────┘
                ↓
            React UI


