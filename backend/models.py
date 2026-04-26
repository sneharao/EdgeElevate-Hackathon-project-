"""
Pydantic models for structured LLM output in the EdgeElevate pipeline.

These models ensure LLM responses are validated before being stored in state,
using LangChain's .with_structured_output() feature.
"""

from typing import Literal
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# NARRATIVE ANALYSIS MODELS
# ---------------------------------------------------------------------------

class OwnBrandFraming(BaseModel):
    """How the AI frames the user's own brand."""
    positive_patterns: list[str] = Field(description="Positive language/claims AI makes about the brand")
    negative_patterns: list[str] = Field(description="Negative language or concerns raised")
    neutral_descriptors: list[str] = Field(description="Factual descriptions used")
    missing_narratives: list[str] = Field(description="Things AI should say but doesn't")


class CompetitorFraming(BaseModel):
    """How the AI frames a specific competitor."""
    name: str = Field(description="Competitor name")
    key_advantages_cited: list[str] = Field(description="What AI says they're good at")
    vulnerabilities: list[str] = Field(description="Weaknesses or caveats AI mentions")
    counter_narrative_opportunities: list[str] = Field(description="Claims we could challenge or reframe")


class NarrativeAnalysis(BaseModel):
    """Complete narrative analysis output from the LLM."""
    own_brand_framing: OwnBrandFraming
    competitor_framings: list[CompetitorFraming]
    overall_category_narrative: str = Field(description="How AI engines frame this entire product category")
    strategic_reframe: str = Field(description="A recommended narrative shift for the brand")


# ---------------------------------------------------------------------------
# CONTENT OPPORTUNITY MODELS
# ---------------------------------------------------------------------------

class ContentOpportunity(BaseModel):
    """A single content opportunity recommendation."""
    rank: int = Field(description="Priority ranking (1 = highest)")
    title: str = Field(description="Short opportunity name")
    format: Literal["blog_post", "video", "linkedin_post", "reddit_thread", "guest_article", "infographic"] = Field(
        description="Content format type"
    )
    channel: str = Field(description="Where to publish (specific site/platform)")
    topic: str = Field(description="Specific topic/angle")
    target_competitor: str = Field(description="Which competitor this aims to displace, or 'general'")
    target_query: str = Field(description="The AI search query this content should appear for")
    reasoning: str = Field(description="1-2 sentences on why this is high impact, citing specific data")
    priority_score: float = Field(ge=0.0, le=1.0, description="Priority score from 0.0 to 1.0")
    estimated_effort: Literal["low", "medium", "high"] = Field(description="Estimated effort level")


class ContentOpportunitiesList(BaseModel):
    """Wrapper for a list of content opportunities."""
    opportunities: list[ContentOpportunity] = Field(description="Ranked list of content opportunities")
