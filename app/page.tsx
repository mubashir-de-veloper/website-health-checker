"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";

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

interface SearchConsoleResponse {
  success: boolean;
  siteUrl?: string;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  performance?: {
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  };
  topQueries?: {
    query: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }[];
  topPages?: {
    page: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }[];
  error?: string;
}

interface SearchConsoleSite {
  siteUrl: string;
  permissionLevel: string;
}

interface SearchConsoleSitesResponse {
  success: boolean;
  sites?: SearchConsoleSite[];
  error?: string;
}

export default function Home() {
//  const { data: session, status: sessionStatus } = useSession();
  const [searchConsoleDays, setSearchConsoleDays] = useState("28");
  const [url, setUrl] = useState("");
  const [report, setReport] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [searchConsole, setSearchConsole] =
  useState<SearchConsoleResponse | null>(null);

  const [searchConsoleLoading, setSearchConsoleLoading] =
    useState(false);

  const [searchConsoleError, setSearchConsoleError] =
    useState("");

  const [searchConsoleSites, setSearchConsoleSites] =
    useState<SearchConsoleSite[]>([]);
  
  const [selectedSearchConsoleSite, setSelectedSearchConsoleSite] =
    useState("");
  
  const [searchConsoleSitesLoading, setSearchConsoleSitesLoading] =
    useState(false);

    async function loadSearchConsoleSites() {
      setSearchConsoleSitesLoading(true);
      setSearchConsoleError("");
    
      try {
        const response = await fetch("/api/search-console");
        const data: SearchConsoleSitesResponse =
          await response.json();
    
        if (!response.ok || !data.success) {
          throw new Error(
            data.error ||
              "Unable to retrieve Search Console properties."
          );
        }
    
        const sites = data.sites ?? [];
    
        setSearchConsoleSites(sites);
    
        const ownerSite = sites.find(
          (site) => site.permissionLevel === "siteOwner"
        );
    
        if (ownerSite) {
          setSelectedSearchConsoleSite(ownerSite.siteUrl);
        }
      } catch (err) {
        setSearchConsoleError(
          err instanceof Error
            ? err.message
            : "Unable to retrieve Search Console properties."
        );
      } finally {
        setSearchConsoleSitesLoading(false);
      }
    }
  
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

      if (!selectedSearchConsoleSite) {
        setSearchConsole(null);
        setSearchConsoleError(
          "Select a Google Search Console property first."
        );
        return;
      }

      setSearchConsole(null);
      setSearchConsoleError("");
      setSearchConsoleLoading(true);

      try {
        const searchConsoleResponse = await fetch(
          `/api/search-console?siteUrl=${encodeURIComponent(
            selectedSearchConsoleSite
          )}&days=${searchConsoleDays}`
        );

        const searchConsoleData =
          await searchConsoleResponse.json();

        if (!searchConsoleResponse.ok) {
          setSearchConsoleError(
            searchConsoleData.error ||
              "Unable to retrieve Google Search Console data."
          );
        } else {
          setSearchConsole(searchConsoleData);
        }
      } catch {
        setSearchConsoleError(
          "Unable to connect to Google Search Console."
        );
      } finally {
        setSearchConsoleLoading(false);
      }
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

            <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm">
              <label
                htmlFor="search-console-days"
                className="text-sm font-semibold text-slate-700"
              >
                Search Console Date Range
              </label>

              <select
                id="search-console-days"
                value={searchConsoleDays}
                onChange={(event) =>
                  setSearchConsoleDays(event.target.value)
                }
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700"
              >
                <option value="7">Last 7 days</option>
                <option value="28">Last 28 days</option>
                <option value="90">Last 90 days</option>
              </select>
            </div>

            <div className="mx-auto mt-6 max-w-xl">
              <button
                type="button"
                onClick={() => signIn("google")}
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Connect Google Search Console
              </button>

              <button
                type="button"
                onClick={loadSearchConsoleSites}
                disabled={searchConsoleSitesLoading}
                className="ml-3 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {searchConsoleSitesLoading
                  ? "Loading Search Console..."
                  : "Load Search Console Properties"}
              </button>

              {searchConsoleSites.length > 0 && (
                <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm">
                  <label
                    htmlFor="search-console-site"
                    className="text-sm font-semibold text-slate-700"
                  >
                    Search Console Property
                  </label>

                  <select
                    id="search-console-site"
                    value={selectedSearchConsoleSite}
                    onChange={(event) =>
                      setSelectedSearchConsoleSite(event.target.value)
                    }
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700"
                  >
                    <option value="">
                      Select a Search Console property
                    </option>

                    {searchConsoleSites.map((site) => (
                      <option key={site.siteUrl} value={site.siteUrl}>
                        {site.siteUrl} — {site.permissionLevel}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {searchConsoleError && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm text-amber-700">
                  {searchConsoleError}
                </div>
              )}
            </div>

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

          {/* Google Search Performance */}
          <div className="mt-10">
            <div className="mb-5">
              <h2 className="text-2xl font-bold">
                Google Search Performance
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Search performance data from Google Search Console.
              </p>
            </div>

            {searchConsoleLoading ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                <p className="text-sm text-slate-500">
                  Loading Google Search Console data...
                </p>
              </div>
            ) : searchConsoleError ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
                <p className="font-semibold text-amber-800">
                  Google Search Console data unavailable
                </p>

                <p className="mt-1 text-sm text-amber-700">
                  {searchConsoleError}
                </p>
              </div>
            ) : searchConsole ? (
              <>
                {/* Performance overview */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <SearchConsoleMetric
                    label="Clicks"
                    value={searchConsole.performance?.clicks ?? 0}
                    description="Google search clicks"
                  />

                  <SearchConsoleMetric
                    label="Impressions"
                    value={searchConsole.performance?.impressions ?? 0}
                    description="Search appearances"
                  />

                  <SearchConsoleMetric
                    label="CTR"
                    value={`${(
                      (searchConsole.performance?.ctr ?? 0) * 100
                    ).toFixed(2)}%`}
                    description="Average click-through rate"
                  />

                  <SearchConsoleMetric
                    label="Average Position"
                    value={
                      searchConsole.performance?.position
                        ? searchConsole.performance.position.toFixed(1)
                        : "No data"
                    }
                    description="Average search position"
                  />
                </div>

                {/* Date range */}
                {searchConsole.dateRange && (
                  <p className="mt-4 text-xs text-slate-500">
                    Data from {searchConsole.dateRange.startDate} to{" "}
                    {searchConsole.dateRange.endDate}
                  </p>
                )}

                {/* Top queries and pages */}
                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                  {/* Top queries */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <h3 className="text-lg font-bold">
                      Top Search Queries
                    </h3>

                    {searchConsole.topQueries &&
                    searchConsole.topQueries.length > 0 ? (
                      <div className="mt-5 space-y-3">
                        {searchConsole.topQueries.map((item) => (
                          <div
                            key={item.query}
                            className="rounded-xl border border-slate-100 p-4"
                          >
                            <p className="break-words text-sm font-semibold text-slate-900">
                              {item.query}
                            </p>

                            <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
                              <span>
                                Clicks: {item.clicks}
                              </span>

                              <span>
                                Impressions: {item.impressions}
                              </span>

                              <span>
                                Position: {item.position.toFixed(1)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-5 rounded-xl bg-slate-50 p-5 text-center">
                        <p className="text-sm font-medium text-slate-700">
                          No search query data yet.
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Search Console has not recorded search
                          performance data for this site yet.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Top pages */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <h3 className="text-lg font-bold">
                      Top Pages
                    </h3>

                    {searchConsole.topPages &&
                    searchConsole.topPages.length > 0 ? (
                      <div className="mt-5 space-y-3">
                        {searchConsole.topPages.map((item) => (
                          <div
                            key={item.page}
                            className="rounded-xl border border-slate-100 p-4"
                          >
                            <p className="break-all text-sm font-semibold text-slate-900">
                              {item.page}
                            </p>

                            <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
                              <span>
                                Clicks: {item.clicks}
                              </span>

                              <span>
                                Impressions: {item.impressions}
                              </span>

                              <span>
                                Position: {item.position.toFixed(1)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-5 rounded-xl bg-slate-50 p-5 text-center">
                        <p className="text-sm font-medium text-slate-700">
                          No page data yet.
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Search Console has not recorded search
                          performance data for this site yet.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : null}
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

function SearchConsoleMetric({
  label,
  value,
  description,
}: {
  label: string;
  value: string | number;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-slate-600">
        {label}
      </p>

      <p className="mt-3 text-3xl font-bold text-slate-900">
        {value}
      </p>

      <p className="mt-2 text-xs text-slate-500">
        {description}
      </p>
    </div>
  );
}