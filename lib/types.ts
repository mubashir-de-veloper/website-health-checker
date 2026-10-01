export interface OpenGraphData {
    title: string | null;
    description: string | null;
    image: string | null;
    url: string | null;
  }
  
  export interface AnalysisResult {
    success: boolean;
    url: string;
  
    seo: {
      title: string | null;
      titleLength: number;
      metaDescription: string | null;
      metaDescriptionLength: number;
      canonical: string | null;
      openGraph: OpenGraphData;
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
  }