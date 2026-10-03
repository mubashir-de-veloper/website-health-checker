import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  });

  if (!token?.accessToken) {
    return Response.json(
      {
        success: false,
        error: "Not authenticated with Google",
      },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const siteUrl = searchParams.get("siteUrl");
  const days = Number(searchParams.get("days") || "28");


  const headers = {
    Authorization: `Bearer ${token.accessToken}`,
    "Content-Type": "application/json",
  };
  
  // If no siteUrl was provided, return the user's Search Console properties.
  if (!siteUrl) {
    try {
      const sitesResponse = await fetch(
        "https://www.googleapis.com/webmasters/v3/sites",
        {
          headers,
        }
      );
  
      if (!sitesResponse.ok) {
        const errorText = await sitesResponse.text();
  
        return Response.json(
          {
            success: false,
            error: "Failed to retrieve Search Console properties",
            details: errorText,
          },
          { status: sitesResponse.status }
        );
      }
  
      const sitesData = await sitesResponse.json();
  
      return Response.json({
        success: true,
        sites: sitesData.siteEntry ?? [],
      });
    } catch (error) {
      console.error(
        "Search Console properties error:",
        error
      );
  
      return Response.json(
        {
          success: false,
          error: "Failed to retrieve Search Console properties",
        },
        { status: 500 }
      );
    }
  }


  try {
    // Search Console data can have a short delay,
    // so we exclude the most recent 2 days.
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 2);

    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - (days - 1));

    const formatDate = (date: Date) =>
      date.toISOString().split("T")[0];

    const start = formatDate(startDate);
    const end = formatDate(endDate);

    const apiUrl =
      `https://www.googleapis.com/webmasters/v3/sites/` +
      `${encodeURIComponent(siteUrl)}/searchAnalytics/query`;

    //const headers = {
    //  Authorization: `Bearer ${token.accessToken}`,
    //  "Content-Type": "application/json",
    //};

    // 1. Overall performance
    const overallResponse = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        startDate: start,
        endDate: end,
        type: "web",
        rowLimit: 1,
      }),
    });

    if (!overallResponse.ok) {
      const errorText = await overallResponse.text();

      return Response.json(
        {
          success: false,
          error: "Google Search Console API request failed",
          details: errorText,
        },
        { status: overallResponse.status }
      );
    }

    const overallData = await overallResponse.json();
    const overallRow = overallData.rows?.[0];

    // 2. Top search queries
    const queryResponse = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        startDate: start,
        endDate: end,
        type: "web",
        dimensions: ["query"],
        rowLimit: 10,
      }),
    });

    if (!queryResponse.ok) {
      const errorText = await queryResponse.text();

      return Response.json(
        {
          success: false,
          error: "Failed to retrieve search queries",
          details: errorText,
        },
        { status: queryResponse.status }
      );
    }

    const queryData = await queryResponse.json();

    const topQueries = (queryData.rows ?? []).map(
      (row: {
        keys?: string[];
        clicks?: number;
        impressions?: number;
        ctr?: number;
        position?: number;
      }) => ({
        query: row.keys?.[0] ?? "",
        clicks: row.clicks ?? 0,
        impressions: row.impressions ?? 0,
        ctr: row.ctr ?? 0,
        position: row.position ?? 0,
      })
    );

    // 3. Top pages
    const pageResponse = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        startDate: start,
        endDate: end,
        type: "web",
        dimensions: ["page"],
        rowLimit: 10,
      }),
    });

    if (!pageResponse.ok) {
      const errorText = await pageResponse.text();

      return Response.json(
        {
          success: false,
          error: "Failed to retrieve top pages",
          details: errorText,
        },
        { status: pageResponse.status }
      );
    }

    const pageData = await pageResponse.json();

    const topPages = (pageData.rows ?? []).map(
      (row: {
        keys?: string[];
        clicks?: number;
        impressions?: number;
        ctr?: number;
        position?: number;
      }) => ({
        page: row.keys?.[0] ?? "",
        clicks: row.clicks ?? 0,
        impressions: row.impressions ?? 0,
        ctr: row.ctr ?? 0,
        position: row.position ?? 0,
      })
    );

    return Response.json({
      success: true,

      siteUrl,

      dateRange: {
        startDate: start,
        endDate: end,
      },

      performance: {
        clicks: overallRow?.clicks ?? 0,
        impressions: overallRow?.impressions ?? 0,
        ctr: overallRow?.ctr ?? 0,
        position: overallRow?.position ?? 0,
      },

      topQueries,
      topPages,
    });
  } catch (error) {
    console.error("Search Console API error:", error);

    return Response.json(
      {
        success: false,
        error: "Failed to retrieve Search Console data",
      },
      { status: 500 }
    );
  }
}