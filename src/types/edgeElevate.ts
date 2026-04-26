export interface BrandMetrics {
  brand_id: string;
  brand_name: string;
  visibility: number;      // 0-1 ratio (display as %)
  sentiment: number;       // 0-100
  position: number;        // rank, lower = better
  share_of_voice: number;  // 0-1 ratio
}

export interface CompetitiveDisplacementScore {
  competitor_name: string;
  competitor_id: string;
  displacement_score: number;
  visibility_gap: number;
  sentiment_delta: number;
  position_proximity: number;
  source_overlap_ratio: number;
  shared_domains: string[];
  competitor_only_domains: string[];
  priority: "HIGH" | "MEDIUM" | "LOW";
}

export interface SourceGapEntry {
  domain: string;
  classification: string;
  citation_rate: number;
  citation_count: number;
  retrieved_percentage: number;
  own_brand_present: boolean;
  competitors_present: string[];
}

export interface SourceGapMap {
  missing_high_authority: SourceGapEntry[];
  present_low_impact: SourceGapEntry[];
  competitive_battlegrounds: SourceGapEntry[];
  untapped_channels: SourceGapEntry[];
}

export interface ContentOpportunity {
  rank: number;
  title: string;
  format: "blog_post" | "video" | "linkedin_post" | "reddit_thread" | "guest_article" | "infographic";
  channel: string;
  topic: string;
  target_competitor: string;
  priority_score: number;
  estimated_effort: "low" | "medium" | "high";
}

export interface LinkedInPost {
  type: "data_insight" | "founder_narrative" | "product_led";
  hook: string;
  body: string;
  cta: string;
  hashtags: string[];
}

export interface VideoScriptSection {
  timestamp: string;
  section_name: string;
  script: string;
  visual_notes: string;
  duration_seconds: number;
}

export interface VideoScript {
  title: string;
  description: string;
  duration_minutes: number;
  sections: VideoScriptSection[];
  tags: string[];
  thumbnail_concept: string;
}

export interface OwnBrandFraming {
  positive_patterns: string[];
  negative_patterns: string[];
  neutral_descriptors: string[];
  missing_narratives: string[];
}

export interface CompetitorFraming {
  name: string;
  key_advantages_cited: string[];
  vulnerabilities: string[];
  counter_narrative_opportunities: string[];
}

export interface NarrativeAnalysis {
  own_brand_framing: OwnBrandFraming;
  competitor_framings: CompetitorFraming[];
  overall_category_narrative: string;
  strategic_reframe: string;
}

export interface EdgeElevateResponse {
  startup_name: string;
  brand_report: BrandMetrics[];
  own_brand: { id: string; name: string };
  competitor_brands: { id: string; name: string }[];
  competitive_displacement_scores: CompetitiveDisplacementScore[];
  source_gap_map: SourceGapMap;
  content_opportunities: ContentOpportunity[];
  narrative_analysis?: NarrativeAnalysis;
  positioning_statement: string;
  linkedin_posts: LinkedInPost[];
  video_script: VideoScript | null;
  executive_summary: string;
  errors: string[];
}
