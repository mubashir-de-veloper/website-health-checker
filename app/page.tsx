"use client";

import { FormEvent, useState } from "react";

interface Check {
  id: string;
  category: "seo" | "technical" | "content";
  name: string;
  status: "pass" | "warning" | "fail";
  message: string;
  points: number;
  maxPoints: number;
}

interface Recommendation {
  id: string;
  priority: "high" | "medium";
  title: string;
  description: string;
}

interface AnalysisResponse {
  success: boolean;
  url: string;
  seo: {
    title: string | null;
    titleLength: number;
    metaDescription: string | null;
    metaDescriptionLength: number;
    canonical: string | null;
    openGraph: {
      title: string | null;
      description: string | null;
      image: string | null;
      url: string | null;
    };
  };
  technical: {
    https: boolean;
    viewport: string | null;
    language: string | null;
  };
  headings: {
    h1: string[];
    h2: number;
    h3: number;
    h4: number;
    h5: number;
    h6: number;
  };
  images: {
    total: number;
    withoutAlt: number;
  };
  content: {
    wordCount: number;
  };
  checks: Check[];
  scores: {
    seo: number;
    technical: number;
    content: number;
    overall: number;
  };
  recommendations: Recommendation[];
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [report, setReport] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setReport(null);

    let formattedUrl = url.trim();

    if (!formattedUrl) {
      setError("Please enter a website URL.");
      return;
    }

    if (
      !formattedUrl.startsWith("http://") &&
      !formattedUrl.startsWith("https://")
    ) {
      formattedUrl = `https://${formattedUrl}`;
    }

    try {
      new URL(formattedUrl);
    } catch {
      setError("Please enter a valid website URL.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: formattedUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to analyze the website.");
      }

      setReport(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while analyzing the website."
      );
    } finally {
      setLoading(false);
    }
  }

  function getStatusIcon(status: Check["status"]) {
    if (status === "pass") return "✓";
    if (status === "warning") return "!";
    return "×";
  }

  function getStatusClass(status: Check["status"]) {
    if (status === "pass") {
      return "bg-green-100 text-green-700";
    }

    if (status === "warning") {
      return "bg-amber-100 text-amber-700";
    }

    return "bg-red-100 text-red-700";
  }

  function getCategoryChecks(category: Check["category"]) {
    return (
      report?.checks.filter(
        (check) => check.category === category
      ) || []
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header / Hero */}
      <section className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
              Free • No signup • No API key
            </div>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Website Health Checker
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Analyze your website&apos;s SEO, technical and content
              health with an automated report.
            </p>

            <form
              onSubmit={handleSubmit}
              className="mx-auto mt-8 flex max-w-3xl flex-col gap-3 sm:flex-row"
            >
              <input
                type="text"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://example.com"
                aria-label="Website URL"
                className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-5 py-4 text-base shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              />

              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-blue-600 px-8 py-4 font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Analyzing..." : "Analyze Website"}
              </button>
            </form>

            {loading && (
              <p className="mt-4 text-sm text-slate-500">
                Fetching and analyzing the website...
              </p>
            )}

            {error && (
              <div className="mx-auto mt-5 max-w-3xl rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-left text-sm text-red-700">
                {error}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Report */}
      {report && (
        <section className="mx-auto max-w-6xl px-5 py-10 sm:px-6 sm:py-14">
          {/* Report heading */}
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
              Website Health Report
            </p>

            <h2 className="mt-2 break-all text-2xl font-bold sm:text-3xl">
              {new URL(report.url).hostname}
            </h2>

            <p className="mt-1 break-all text-sm text-slate-500">
              {report.url}
            </p>
          </div>

          {/* Score overview */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="grid gap-8 lg:grid-cols-[220px_1fr] lg:items-center">
              {/* Overall score */}
              <div className="flex flex-col items-center text-center">
                <div className="flex h-40 w-40 items-center justify-center rounded-full border-[10px] border-blue-100">
                  <div>
                    <div className="text-5xl font-bold">
                      {report.scores.overall}
                    </div>

                    <div className="mt-1 text-sm text-slate-500">
                      / 100
                    </div>
                  </div>
                </div>

                <p className="mt-4 text-sm font-semibold text-slate-700">
                  Overall Health Score
                </p>
              </div>

              {/* Category scores */}
              <div className="grid gap-4 sm:grid-cols-3">
                <ScoreCard
                  label="SEO"
                  score={report.scores.seo}
                  description="Search visibility"
                />

                <ScoreCard
                  label="Technical"
                  score={report.scores.technical}
                  description="Technical health"
                />

                <ScoreCard
                  label="Content"
                  score={report.scores.content}
                  description="Content quality"
                />
              </div>
            </div>
          </div>

          {/* Checks */}
          <div className="mt-8">
            <div className="mb-5">
              <h2 className="text-2xl font-bold">
                Website Checks
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                See exactly what passed, needs attention, or failed.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <CheckSection
                title="SEO"
                checks={getCategoryChecks("seo")}
                getStatusIcon={getStatusIcon}
                getStatusClass={getStatusClass}
              />

              <CheckSection
                title="Technical"
                checks={getCategoryChecks("technical")}
                getStatusIcon={getStatusIcon}
                getStatusClass={getStatusClass}
              />

              <CheckSection
                title="Content"
                checks={getCategoryChecks("content")}
                getStatusIcon={getStatusIcon}
                getStatusClass={getStatusClass}
              />
            </div>
          </div>

          {/* Recommendations */}
          <div className="mt-10">
            <div className="mb-5">
              <h2 className="text-2xl font-bold">
                Recommended Improvements
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Practical actions based on the checks above.
              </p>
            </div>

            {report.recommendations.length > 0 ? (
              <div className="grid gap-4">
                {report.recommendations.map(
                  (recommendation, index) => (
                    <div
                      key={recommendation.id}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 font-bold text-blue-700">
                          {index + 1}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-slate-900">
                              {recommendation.title}
                            </h3>

                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                recommendation.priority === "high"
                                  ? "bg-red-50 text-red-700"
                                  : "bg-amber-50 text-amber-700"
                              }`}
                            >
                              {recommendation.priority === "high"
                                ? "High priority"
                                : "Medium priority"}
                            </span>
                          </div>

                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            {recommendation.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
                <p className="font-semibold text-green-800">
                  No major issues found.
                </p>

                <p className="mt-1 text-sm text-green-700">
                  Your website passed all of the current checks.
                </p>
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="mt-10 overflow-hidden rounded-2xl bg-slate-900 px-6 py-10 text-center shadow-sm sm:px-10">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-300">
              Khawaja Labs
            </p>

            <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
              Need help improving your website?
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
              Talk to Khawaja Labs about improving your website&apos;s
              SEO, technical health and user experience.
            </p>

            <a
              href="https://mail.google.com/mail/?view=cm&fs=1&to=khawajaalabs@gmail.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-block rounded-xl bg-white px-6 py-3 font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              Talk to Khawaja Labs →
            </a>
          </div>
        </section>
      )}
    </main>
  );
}

function ScoreCard({
  label,
  score,
  description,
}: {
  label: string;
  score: number;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <p className="text-sm font-semibold text-slate-600">
        {label}
      </p>

      <div className="mt-3 flex items-end gap-1">
        <span className="text-4xl font-bold text-slate-900">
          {score}
        </span>

        <span className="mb-1 text-sm text-slate-400">
          /100
        </span>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-blue-600 transition-all"
          style={{ width: `${score}%` }}
        />
      </div>

      <p className="mt-3 text-xs text-slate-500">
        {description}
      </p>
    </div>
  );
}

function CheckSection({
  title,
  checks,
  getStatusIcon,
  getStatusClass,
}: {
  title: string;
  checks: Check[];
  getStatusIcon: (status: Check["status"]) => string;
  getStatusClass: (status: Check["status"]) => string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h3 className="text-lg font-bold">
        {title}
      </h3>

      <div className="mt-5 space-y-3">
        {checks.map((check) => (
          <div
            key={check.id}
            className="rounded-xl border border-slate-100 p-4"
          >
            <div className="flex items-start gap-3">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${getStatusClass(
                  check.status
                )}`}
              >
                {getStatusIcon(check.status)}
              </span>

              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">
                  {check.name}
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {check.message}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}