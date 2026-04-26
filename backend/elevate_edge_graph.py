"""
EdgeElevate: Competitive Intelligence Orchestrated for Distribution
=============================================
A LangGraph-powered workflow that uses Peec AI MCP to help early-stage brands
win distribution against bigger competitors.

Architecture refined based on actual Peec AI API responses:
- Brand reports return columnar JSON with visibility, sentiment, position, share_of_voice
- Domain reports show which sources (youtube, reddit, editorial sites) AI engines cite
- Actions use a 2-step workflow: overview → drilldown with opportunity scoring
- Chat analysis reveals exactly how brands are described in AI responses
- Search queries show what AI engines actually search for when answering prompts

LangGraph nodes are designed to be composable and each produces structured state
that downstream nodes can consume.
"""

import os
import json
import operator
import hashlib
from pathlib import Path
from typing import TypedDict, Annotated, Literal, Optional
from datetime import datetime, timedelta
from dotenv import load_dotenv
from contextlib import contextmanager

from langgraph.graph import StateGraph, END
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from pydantic import BaseModel

from models import NarrativeAnalysis, ContentOpportunitiesList

# Langfuse for observability
from langfuse import Langfuse, observe, get_client as get_langfuse_client
from langfuse.langchain import CallbackHandler as LangfuseCallbackHandler

# ---------------------------------------------------------------------------
# 0. CONFIG
# ---------------------------------------------------------------------------

# Load environment variables from .env file
load_dotenv()

OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "")
PEEC_API_KEY = os.environ.get("PEEC_API_KEY", "")
PEEC_API_BASE_URL = "https://api.peec.ai/customer/v1"

# Langfuse config (set these in .env or environment)
# LANGFUSE_PUBLIC_KEY, LANGFUSE_SECRET_KEY, LANGFUSE_HOST (optional, defaults to cloud)
LANGFUSE_ENABLED = os.environ.get("LANGFUSE_PUBLIC_KEY", "") != ""

# Initialize Langfuse client for manual spans
langfuse_client: Optional[Langfuse] = None
if LANGFUSE_ENABLED:
    langfuse_client = Langfuse()

# Cache directory for API responses
CACHE_DIR = Path(__file__).parent / "cache"
CACHE_DIR.mkdir(exist_ok=True)
USE_CACHE = True  # Set to False to bypass cache

# OpenRouter LLM with affordable model for all LLM calls
LLM = ChatOpenAI(
    model="google/gemini-2.5-flash-lite",  # Free Gemini 2.5 Flash Lite
    openai_api_key=OPENROUTER_API_KEY,
    openai_api_base="https://openrouter.ai/api/v1",
    max_tokens=4096,
    temperature=0.7,
)


# ---------------------------------------------------------------------------
# LANGFUSE TRACING HELPERS
# ---------------------------------------------------------------------------

# Thread-local storage for current trace context
import threading
_trace_context = threading.local()


def get_current_trace():
    """Get the current Langfuse trace from thread-local storage."""
    return getattr(_trace_context, 'trace', None)


def set_current_trace(trace):
    """Set the current Langfuse trace in thread-local storage."""
    _trace_context.trace = trace


def get_langfuse_handler() -> Optional[LangfuseCallbackHandler]:
    """Get a Langfuse callback handler for LangChain integration."""
    if LANGFUSE_ENABLED:
        return LangfuseCallbackHandler()
    return None


@contextmanager
def trace_span(name: str, metadata: dict = None, input_data: dict = None):
    """
    Context manager to create a Langfuse span for tracing operations.

    Usage:
        with trace_span("fetch_brand_intelligence", input_data={"project_id": pid}) as span:
            result = do_something()
            span.end(output=result)

    Note: In Langfuse v4, this is simplified. Use @observe decorator for better tracing.
    """
    # No-op context manager - v4 uses @observe decorator instead
    class NoOpSpan:
        def end(self, **kwargs): pass
    yield NoOpSpan()


def clean_llm_json_response(response: str) -> str:
    """
    Clean LLM response by removing markdown code fences before JSON parsing.
    LLMs often wrap JSON in ```json ... ``` blocks.
    """
    cleaned = response.strip()
    # Remove markdown code fences
    if cleaned.startswith("```"):
        # Remove opening fence (```json or ```)
        first_newline = cleaned.find("\n")
        if first_newline != -1:
            cleaned = cleaned[first_newline + 1:]
        else:
            cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    return cleaned.strip()


def invoke_llm(messages: list, generation_name: str = "llm_call") -> str:
    """
    Invoke the LLM with Langfuse tracing.

    Args:
        messages: List of LangChain messages (SystemMessage, HumanMessage)
        generation_name: Name for the generation in Langfuse traces

    Returns:
        The response content as a string
    """
    handler = get_langfuse_handler()
    config = {"callbacks": [handler]} if handler else {}

    with trace_span(f"generation:{generation_name}", input_data={"messages": [m.content[:200] for m in messages]}) as span:
        try:
            response = LLM.invoke(messages, config=config)
            if response is None:
                raise ValueError(f"LLM returned None for {generation_name}")
            content = response.content
            if content is None:
                raise ValueError(f"LLM response.content is None for {generation_name}")
            span.end(output={"response_preview": content[:300] if content else ""})
            return content
        except Exception as e:
            print(f"[ERROR] invoke_llm({generation_name}) failed: {type(e).__name__}: {e}")
            span.end(output={"error": str(e)})
            raise


def invoke_llm_structured(
    messages: list,
    output_schema: type[BaseModel],
    generation_name: str = "llm_call_structured"
) -> dict:
    """
    Invoke the LLM with structured output using Pydantic validation.

    Uses LangChain's .with_structured_output() to ensure the response
    conforms to the schema, with automatic retries on validation errors.

    Args:
        messages: List of LangChain messages (SystemMessage, HumanMessage)
        output_schema: Pydantic model class defining the expected output structure
        generation_name: Name for the generation in Langfuse traces

    Returns:
        A validated dict matching the schema
    """
    handler = get_langfuse_handler()
    config = {"callbacks": [handler]} if handler else {}

    structured_llm = LLM.with_structured_output(output_schema)

    with trace_span(
        f"generation:{generation_name}",
        input_data={"messages": [m.content[:200] for m in messages], "schema": output_schema.__name__}
    ) as span:
        try:
            response = structured_llm.invoke(messages, config=config)
            if response is None:
                raise ValueError(f"Structured LLM returned None for {generation_name}")
            span.end(output={"schema": output_schema.__name__, "success": True})
            return response.model_dump()
        except Exception as e:
            print(f"[ERROR] invoke_llm_structured({generation_name}) failed: {type(e).__name__}: {e}")
            span.end(output={"error": str(e)})
            raise


def traced_node(node_name: str):
    """
    Decorator to trace LangGraph node execution with Langfuse.

    Usage:
        @traced_node("fetch_brand_intelligence")
        def fetch_brand_intelligence(state: EdgeElevateState) -> dict:
            ...
    """
    def decorator(func):
        def wrapper(state: EdgeElevateState) -> dict:
            # current_step is now a list due to parallel execution support
            steps = state.get("current_step", [])
            current_step_str = steps[-1] if steps else "unknown"
            with trace_span(
                f"node:{node_name}",
                metadata={"current_step": current_step_str},
                input_data={"startup_name": state.get("startup_name"), "project_id": state.get("project_id")}
            ) as span:
                try:
                    result = func(state)
                    result_steps = result.get("current_step", [])
                    result_step_str = result_steps[-1] if result_steps else "unknown"
                    span.end(output={
                        "current_step": result_step_str,
                        "errors": result.get("errors", [])
                    })
                    return result
                except Exception as e:
                    span.end(level="ERROR", status_message=str(e))
                    raise
        return wrapper
    return decorator

# ---------------------------------------------------------------------------
# 1. STATE DEFINITION
# ---------------------------------------------------------------------------

class EdgeElevateState(TypedDict):
    """
    Central state passed through every node.
    Each node reads what it needs and writes its output key(s).
    Using Annotated[list, operator.add] for keys that accumulate across nodes.
    """

    # ── User input ──
    startup_name: str
    project_id: str  # resolved from list_projects

    # ── Peec AI raw data ──
    brands: list[dict]               # list_brands result
    own_brand: dict                  # the brand with is_own=True
    competitor_brands: list[dict]    # brands with is_own=False
    brand_report: list[dict]         # get_brand_report rows
    domain_report: list[dict]        # get_domain_report rows
    actions_overview: list[dict]     # get_actions scope=overview
    actions_drilldowns: list[dict]   # get_actions drilldown results
    search_queries: list[dict]       # list_search_queries rows
    sample_chats: list[dict]         # get_chat full responses (sampled)
    prompts: list[dict]              # list_prompts rows

    # ── Derived analysis ──
    competitive_displacement_scores: list[dict]  # per-competitor displacement opportunity
    narrative_analysis: dict          # how brand is described vs competitors
    source_gap_map: dict             # sources where brand is missing but competitors present
    content_opportunities: list[dict] # merged + ranked content ideas

    # ── Generated outputs ──
    positioning_statement: str
    report_markdown: str
    linkedin_posts: list[dict]       # 3 post drafts
    video_script: str
    executive_summary: str

    # ── Control flow ──
    errors: Annotated[list[str], operator.add]
    current_step: Annotated[list[str], operator.add]  # accumulates steps from parallel nodes


# ---------------------------------------------------------------------------
# 2. PEEC AI REST API HELPER
# ---------------------------------------------------------------------------

import requests


def _cache_key(endpoint: str, params: dict = None, body: dict = None) -> str:
    """Generate a unique cache key from endpoint and parameters."""
    key_data = f"{endpoint}:{json.dumps(params or {}, sort_keys=True)}:{json.dumps(body or {}, sort_keys=True)}"
    return hashlib.md5(key_data.encode()).hexdigest()


def _get_cached(cache_key: str) -> Optional[dict]:
    """Load cached response if it exists."""
    cache_file = CACHE_DIR / f"{cache_key}.json"
    if cache_file.exists():
        try:
            with open(cache_file, "r") as f:
                data = json.load(f)
                print(f"CACHE HIT: {cache_key[:8]}...")
                return data
        except (json.JSONDecodeError, IOError):
            pass
    return None


def _save_cache(cache_key: str, data: dict) -> None:
    """Save response to cache."""
    cache_file = CACHE_DIR / f"{cache_key}.json"
    try:
        with open(cache_file, "w") as f:
            json.dump(data, f, indent=2, default=str)
        print(f"CACHE SAVED: {cache_key[:8]}...")
    except IOError as e:
        print(f"CACHE WRITE ERROR: {e}")


def call_peec_api(endpoint: str, method: str = "GET", params: dict = None, body: dict = None) -> dict:
    """
    Call Peec AI REST API directly with caching and Langfuse tracing.

    Args:
        endpoint: API endpoint path (e.g., "/projects", "/brands")
        method: HTTP method ("GET" or "POST")
        params: Query parameters
        body: Request body for POST requests

    Returns:
        API response as dict (from cache if available)
    """
    # Check cache first (only for GET requests)
    cache_key = _cache_key(endpoint, params, body)
    if USE_CACHE and method == "GET":
        cached = _get_cached(cache_key)
        if cached is not None:
            return cached

    url = f"{PEEC_API_BASE_URL}{endpoint}"
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "x-api-key": PEEC_API_KEY
    }

    # Trace the API call with Langfuse
    with trace_span(
        f"peec_api:{endpoint}",
        metadata={"method": method, "endpoint": endpoint},
        input_data={"params": params, "body": body}
    ) as span:
        try:
            if method == "GET":
                response = requests.get(url, headers=headers, params=params, timeout=30)
            else:
                response = requests.post(url, headers=headers, params=params, json=body or {}, timeout=30)

            print(f"DEBUG: {method} {url}")
            print(f"DEBUG: HTTP Status: {response.status_code}")

            response.raise_for_status()
            result = response.json()
            print(f"DEBUG: Response: {json.dumps(result, indent=2)[:500]}...")

            # Save to cache (GET requests only)
            if USE_CACHE and method == "GET":
                _save_cache(cache_key, result)

            # End span with output
            span.end(output={"status_code": response.status_code, "response_preview": str(result)[:200]})
            return result

        except requests.exceptions.RequestException as e:
            print(f"DEBUG: Request exception: {str(e)}")
            span.end(level="ERROR", status_message=str(e))
            return {"error": f"API request failed: {str(e)}"}


def list_projects() -> dict:
    """List all projects."""
    return call_peec_api("/projects")


def list_brands(project_id: str) -> dict:
    """List brands for a project."""
    return call_peec_api("/brands", params={"project_id": project_id})


def get_brand_report(project_id: str, start_date: str, end_date: str,
                     order_by: list = None, limit: int = 100) -> dict:
    """Get brand report with visibility, sentiment, position metrics."""
    body = {
        "start_date": start_date,
        "end_date": end_date,
        "limit": limit
    }
    if order_by:
        body["order_by"] = order_by
    return call_peec_api("/reports/brands", method="POST",
                         params={"project_id": project_id}, body=body)


def get_domain_report(project_id: str, start_date: str, end_date: str,
                      order_by: list = None, limit: int = 20) -> dict:
    """Get domain report with citation rates and retrieval counts."""
    body = {
        "start_date": start_date,
        "end_date": end_date,
        "limit": limit
    }
    if order_by:
        body["order_by"] = order_by
    return call_peec_api("/reports/domains", method="POST",
                         params={"project_id": project_id}, body=body)


def list_search_queries(project_id: str, start_date: str, end_date: str,
                        limit: int = 50) -> dict:
    """List fanout search queries AI engines fire."""
    body = {
        "start_date": start_date,
        "end_date": end_date,
        "limit": limit
    }
    return call_peec_api("/queries/search", method="POST",
                         params={"project_id": project_id}, body=body)


def list_prompts(project_id: str, limit: int = 50) -> dict:
    """List prompts for a project."""
    return call_peec_api("/prompts", params={"project_id": project_id, "limit": limit})


def list_chats(project_id: str, start_date: str, end_date: str,
               brand_id: str = None, limit: int = 10) -> dict:
    """List chats (AI conversations) for a project."""
    params = {
        "project_id": project_id,
        "limit": limit,
        "start_date": start_date,
        "end_date": end_date
    }
    if brand_id:
        params["brand_id"] = brand_id
    return call_peec_api("/chats", method="GET", params=params)


def get_chat(project_id: str, chat_id: str) -> dict:
    """Get a specific chat content by ID."""
    return call_peec_api(f"/chats/{chat_id}/content", params={"project_id": project_id})


def get_actions(project_id: str, start_date: str, end_date: str,
                scope: str = "overview", **kwargs) -> dict:
    """
    Get recommended actions from Peec AI.
    Note: Actions endpoint not available in REST API - skipping.
    """
    return {"data": []}


def parse_columnar(result: dict) -> list[dict]:
    """
    Peec AI returns columnar JSON: {columns: [...], rows: [[...], ...]}
    This converts it to a list of dicts for easier downstream processing.
    """
    columns = result.get("columns", [])
    rows = result.get("rows", [])
    return [dict(zip(columns, row)) for row in rows]


# ---------------------------------------------------------------------------
# 3. NODE IMPLEMENTATIONS
# ---------------------------------------------------------------------------

# ═══════════════════════════════════════════════════════════════════════════
# NODE 1: RESOLVE PROJECT
# ═══════════════════════════════════════════════════════════════════════════
@traced_node("resolve_project")
def resolve_project(state: EdgeElevateState) -> dict:
    """
    Takes the startup_name from user input and resolves it to a Peec AI project_id.
    If no exact match found, returns the closest match or an error.
    """
    try:
        result = list_projects()
        print(f"DEBUG: Raw API response: {json.dumps(result, indent=2)}")

        # Handle error response
        if "error" in result:
            return {
                "errors": [f"Failed to list projects: {result['error']}"],
                "current_step": ["resolve_project_failed"]
            }

        # Parse response - REST API returns array directly or in 'data' key
        projects = result.get("data", result) if isinstance(result, dict) else result
        if not isinstance(projects, list):
            projects = parse_columnar(result)

        # Fuzzy match on startup name
        startup_lower = state["startup_name"].lower()
        matched = None
        for p in projects:
            name = p.get("name", "")
            if startup_lower in name.lower() or name.lower() in startup_lower:
                matched = p
                break

        if not matched:
            # Fallback: let the user know available projects
            if projects:
                available = [p.get("name", "Unknown") for p in projects]
                return {
                    "errors": [f"No project matching '{state['startup_name']}'. Available: {available}"],
                    "current_step": ["resolve_project_failed"]
                }
            else:
                return {
                    "errors": ["No projects found in Peec AI. Please create a project first."],
                    "current_step": ["resolve_project_failed"]
                }

        return {
            "project_id": matched["id"],
            "current_step": ["project_resolved"]
        }

    except Exception as e:
        return {"errors": [f"resolve_project failed: {str(e)}"], "current_step": ["error"]}


# ═══════════════════════════════════════════════════════════════════════════
# NODE 2: FETCH BRAND INTELLIGENCE
# ═══════════════════════════════════════════════════════════════════════════
@traced_node("fetch_brand_intelligence")
def fetch_brand_intelligence(state: EdgeElevateState) -> dict:
    """
    Fetches brands and brand report in parallel (conceptually).

    From Peec AI we get:
    - list_brands → id, name, domains, aliases, is_own
    - get_brand_report → visibility, mention_count, share_of_voice, sentiment, position

    Key insight from our API exploration:
    - Visibility is 0-1 ratio (fraction of AI responses mentioning this brand)
    - Sentiment is 0-100 scale (most brands score 65-85)
    - Position is average ranking when mentioned (lower = better, 1 = mentioned first)
    - Share of voice is 0-1 ratio of total mentions
    """
    pid = state["project_id"]
    end_date = datetime.now().strftime("%Y-%m-%d")
    start_date = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")

    # Fetch brands
    brands_raw = list_brands(pid)
    brands = brands_raw.get("data", brands_raw) if isinstance(brands_raw, dict) else brands_raw
    if not isinstance(brands, list):
        brands = parse_columnar(brands_raw)

    own_brand_raw = next((b for b in brands if b.get("is_own")), brands[0] if brands else {})
    # Normalize own_brand to have consistent id and name fields
    own_brand = {
        "id": own_brand_raw.get("id", ""),
        "name": own_brand_raw.get("name", state["startup_name"])
    }
    print(f"DEBUG: Resolved own_brand: {own_brand}")
    competitors = [{"id": b.get("id", ""), "name": b.get("name", "Unknown")} for b in brands if not b.get("is_own")]

    # Fetch brand report
    report_raw = get_brand_report(
        project_id=pid,
        start_date=start_date,
        end_date=end_date,
        order_by=[{"field": "visibility", "direction": "desc"}]
    )
    brand_report_raw = report_raw.get("data", report_raw) if isinstance(report_raw, dict) else report_raw
    if not isinstance(brand_report_raw, list):
        brand_report_raw = parse_columnar(report_raw)

    # Build brand_id -> name lookup from list_brands (since get_brand_report doesn't return names)
    brand_id_to_name = {b.get("id", ""): b.get("name", "Unknown") for b in brands}
    print(f"DEBUG: brand_id_to_name mapping: {brand_id_to_name}")

    # Normalize keys for the frontend/downstream nodes
    brand_report = []
    if brand_report_raw:
        print(f"DEBUG: First row keys of brand_report_raw: {list(brand_report_raw[0].keys())}")
        print(f"DEBUG: First row sample: {brand_report_raw[0]}")

    for b in brand_report_raw:
        # Based on logs, Peec AI returns a nested 'brand' object: {'brand': {'id': '...', 'name': '...'}}
        brand_obj = b.get("brand", {})
        if isinstance(brand_obj, dict):
            brand_id = brand_obj.get("id", "")
            brand_name = brand_obj.get("name", brand_id_to_name.get(brand_id, "Unknown"))
        else:
            # Fallback for other report formats
            brand_id = b.get("brandId") or b.get("brand_id") or b.get("id") or ""
            brand_name = brand_id_to_name.get(brand_id, "Unknown")
        
        if not brand_id:
            print(f"WARNING: Row missing brand_id. Available keys: {list(b.keys())}")
        
        brand_report.append({
            "brand_id": brand_id,
            "brand_name": brand_name,
            "visibility": b.get("visibility", 0),
            "sentiment": b.get("sentiment", 0),
            "position": b.get("position", 0),
            "share_of_voice": b.get("share_of_voice", b.get("mention_count", 0) / 1000 if "mention_count" in b else 0),
        })
        print(f"DEBUG: Parsed {brand_name} (ID: {brand_id})")

    return {
        "brands": brands,
        "own_brand": own_brand,
        "competitor_brands": competitors,
        "brand_report": brand_report,
        "current_step": ["brand_intelligence_fetched"]
    }


# ═══════════════════════════════════════════════════════════════════════════
# NODE 3: FETCH SOURCE INTELLIGENCE
# ═══════════════════════════════════════════════════════════════════════════
@traced_node("fetch_source_intelligence")
def fetch_source_intelligence(state: EdgeElevateState) -> dict:
    """
    Fetches domain report + search queries to understand WHERE AI engines
    find information and WHAT they search for.

    Key insight from our exploration:
    - domain_report shows citation_rate (quality signal) and retrieved_percentage
    - Wikipedia had 2.30 citation_rate vs YouTube's 1.13 — small but authoritative
    - search_queries reveals actual queries AI engines fan out to
    - mentioned_brand_ids on domains tells us which brands appear together
    """
    pid = state["project_id"]
    end_date = datetime.now().strftime("%Y-%m-%d")
    start_date = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")

    # Domain report - top 20 by citations
    domain_raw = get_domain_report(
        project_id=pid,
        start_date=start_date,
        end_date=end_date,
        limit=20,
        order_by=[{"field": "citation_count", "direction": "desc"}]
    )
    domain_report = domain_raw.get("data", domain_raw) if isinstance(domain_raw, dict) else domain_raw
    if not isinstance(domain_report, list):
        domain_report = parse_columnar(domain_raw)

    # Search queries AI engines fire
    queries_raw = list_search_queries(
        project_id=pid,
        start_date=start_date,
        end_date=end_date,
        limit=50
    )
    search_queries = queries_raw.get("data", queries_raw) if isinstance(queries_raw, dict) else queries_raw
    if not isinstance(search_queries, list):
        search_queries = parse_columnar(queries_raw)

    # Also fetch prompts for context
    prompts_raw = list_prompts(project_id=pid, limit=50)
    prompts = prompts_raw.get("data", prompts_raw) if isinstance(prompts_raw, dict) else prompts_raw
    if not isinstance(prompts, list):
        prompts = parse_columnar(prompts_raw)

    return {
        "domain_report": domain_report,
        "search_queries": search_queries,
        "prompts": prompts,
        "current_step": ["source_intelligence_fetched"]
    }


# ═══════════════════════════════════════════════════════════════════════════
# NODE 4: FETCH ACTIONS (2-STEP)
# ═══════════════════════════════════════════════════════════════════════════
@traced_node("fetch_actions")
def fetch_actions(state: EdgeElevateState) -> dict:
    """
    Peec AI's get_actions uses a 2-step workflow:
    1. scope=overview → returns opportunity rollups by action_group_type
    2. Drill down into top slices for actual textual recommendations

    Note: The actions endpoint may not be available in REST API.
    If unavailable, returns empty results and the pipeline continues.
    """
    pid = state["project_id"]
    end_date = datetime.now().strftime("%Y-%m-%d")
    start_date = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")

    # Step 1: Overview
    overview_raw = get_actions(
        project_id=pid,
        scope="overview",
        start_date=start_date,
        end_date=end_date
    )
    overview = overview_raw.get("data", overview_raw) if isinstance(overview_raw, dict) else overview_raw
    if not isinstance(overview, list):
        overview = parse_columnar(overview_raw)

    # If no actions available, return empty
    if not overview:
        return {
            "actions_overview": [],
            "actions_drilldowns": [],
            "current_step": ["actions_fetched"]
        }

    # Step 2: Drill into top 5 slices by opportunity_score
    sorted_overview = sorted(overview, key=lambda x: x.get("opportunity_score", 0), reverse=True)
    top_slices = sorted_overview[:5]

    drilldowns = []
    for slice_item in top_slices:
        group_type = slice_item.get("action_group_type", "").lower()
        kwargs = {}

        if group_type in ("owned", "editorial"):
            kwargs["scope"] = group_type
            kwargs["url_classification"] = slice_item.get("url_classification")
        elif group_type in ("reference", "ugc"):
            kwargs["scope"] = group_type
            kwargs["domain"] = slice_item.get("domain")
        else:
            continue

        if kwargs.get("url_classification") or kwargs.get("domain"):
            drill_raw = get_actions(
                project_id=pid,
                start_date=start_date,
                end_date=end_date,
                **kwargs
            )
            drill_results = drill_raw.get("data", drill_raw) if isinstance(drill_raw, dict) else drill_raw
            if not isinstance(drill_results, list):
                drill_results = parse_columnar(drill_raw)
            for r in drill_results:
                r["_source_slice"] = slice_item
            drilldowns.extend(drill_results)

    return {
        "actions_overview": overview,
        "actions_drilldowns": drilldowns,
        "current_step": ["actions_fetched"]
    }


# ═══════════════════════════════════════════════════════════════════════════
# NODE 5: DEEP CHAT ANALYSIS
# ═══════════════════════════════════════════════════════════════════════════
@traced_node("analyze_chats")
def analyze_chats(state: EdgeElevateState) -> dict:
    """
    Samples actual AI conversations to understand HOW the brand is described.

    This is the secret weapon — by reading real AI responses, we can:
    1. See exact language/framing used for our brand vs competitors
    2. Identify negative patterns (why sentiment is low)
    3. Find specific claims made about competitors we can counter
    4. Discover what sources AI engines cite when mentioning each brand

    We sample 5 chats for depth rather than breadth.
    """
    pid = state["project_id"]
    own_brand_id = state["own_brand"].get("id", "")
    end_date = datetime.now().strftime("%Y-%m-%d")
    start_date = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")

    # Get recent chats mentioning our brand
    chats_raw = list_chats(
        project_id=pid,
        start_date=start_date,
        end_date=end_date,
        brand_id=own_brand_id,
        limit=10
    )
    chat_list = chats_raw.get("data", chats_raw) if isinstance(chats_raw, dict) else chats_raw
    if not isinstance(chat_list, list):
        chat_list = parse_columnar(chats_raw)

    # Sample up to 5 chats across different engines for diversity
    seen_engines = set()
    sample_ids = []
    for chat in chat_list:
        engine = chat.get("model_id", "")
        chat_id = chat.get("id", "")
        if chat_id and engine not in seen_engines and len(sample_ids) < 5:
            sample_ids.append(chat_id)
            seen_engines.add(engine)

    # Fill remaining slots if we haven't hit 5
    for chat in chat_list:
        chat_id = chat.get("id", "")
        if chat_id and chat_id not in sample_ids and len(sample_ids) < 5:
            sample_ids.append(chat_id)

    # Fetch full chat content
    sample_chats = []
    for chat_id in sample_ids:
        chat_detail = get_chat(project_id=pid, chat_id=chat_id)
        if "error" not in chat_detail:
            sample_chats.append(chat_detail)

    return {
        "sample_chats": sample_chats,
        "current_step": ["chats_analyzed"]
    }


# ═══════════════════════════════════════════════════════════════════════════
# NODE 6: COMPUTE COMPETITIVE DISPLACEMENT SCORES
# ═══════════════════════════════════════════════════════════════════════════
@traced_node("compute_displacement_scores")
def compute_displacement_scores(state: EdgeElevateState) -> dict:
    """
    THE CORE DIFFERENTIATOR: Computes a Competitive Displacement Score (CDS)
    for each competitor, quantifying how much opportunity exists to displace them.

    CDS formula considers:
    - Visibility gap (how much more visible they are)
    - Sentiment delta (if we can beat their sentiment, there's an opening)
    - Position proximity (if we're mentioned near them, displacement is easier)
    - Source overlap (shared sources = displacement battlegrounds)

    This is NOT something Peec AI gives you out of the box —
    it's our unique analytical layer on top of Peec data.
    """
    brand_report = state.get("brand_report", [])
    own_brand_id = state["own_brand"].get("id", "")
    domain_report = state.get("domain_report", [])

    # Find our brand's metrics
    own_metrics = next(
        (b for b in brand_report if b.get("brand_id") == own_brand_id),
        {"visibility": 0, "sentiment": 0, "position": 10, "share_of_voice": 0}
    )

    displacement_scores = []
    for comp in brand_report:
        if comp.get("brand_id") == own_brand_id:
            continue

        # 1. Visibility gap — higher gap = more potential to gain
        vis_gap = comp.get("visibility", 0) - own_metrics.get("visibility", 0)

        # 2. Sentiment delta — if our sentiment is close or higher, we can compete on quality
        sent_delta = own_metrics.get("sentiment", 0) - comp.get("sentiment", 0)

        # 3. Position proximity — if we're mentioned near them (close positions), displacement is easier
        pos_proximity = 1.0 / (1.0 + abs(
            own_metrics.get("position", 5) - comp.get("position", 5)
        ))

        # 4. Source overlap — count domains where both brands are mentioned
        own_domains = set()
        comp_domains = set()
        comp_brand_id = comp.get("brand_id", "")
        for d in domain_report:
            mentioned = d.get("mentioned_brand_ids", [])
            if own_brand_id in mentioned:
                own_domains.add(d["domain"])
            if comp_brand_id in mentioned:
                comp_domains.add(d["domain"])
        overlap = len(own_domains & comp_domains)
        total = len(own_domains | comp_domains) or 1
        source_overlap_ratio = overlap / total

        # Composite score (weighted)
        cds = (
            vis_gap * 0.35 +           # visibility gap is the biggest lever
            (sent_delta / 100) * 0.20 + # sentiment advantage
            pos_proximity * 0.20 +       # position closeness
            source_overlap_ratio * 0.25  # shared battlegrounds
        )

        displacement_scores.append({
            "competitor_name": comp.get("brand_name", "Unknown"),
            "competitor_id": comp_brand_id,
            "displacement_score": round(cds, 4),
            "visibility_gap": round(vis_gap, 3),
            "sentiment_delta": round(sent_delta, 1),
            "position_proximity": round(pos_proximity, 3),
            "source_overlap_ratio": round(source_overlap_ratio, 3),
            "shared_domains": list(own_domains & comp_domains),
            "competitor_only_domains": list(comp_domains - own_domains),
            "priority": "HIGH" if cds > 0.15 else "MEDIUM" if cds > 0.08 else "LOW",
        })
        print(f"DEBUG: Computed CDS for {comp.get('brand_name')} (ID: {comp_brand_id}): {round(cds, 4)}")

    # Sort by displacement score (highest opportunity first)
    displacement_scores.sort(key=lambda x: x["displacement_score"], reverse=True)

    return {
        "competitive_displacement_scores": displacement_scores,
        "current_step": ["displacement_scores_computed"]
    }


# ═══════════════════════════════════════════════════════════════════════════
# NODE 7: NARRATIVE ANALYSIS (LLM-POWERED)
# ═══════════════════════════════════════════════════════════════════════════
@traced_node("analyze_narrative")
def analyze_narrative(state: EdgeElevateState) -> dict:
    """
    Uses Claude to analyze the actual AI chat responses and extract:
    1. How our brand is framed (positive/negative/neutral language patterns)
    2. How competitors are framed in comparison
    3. What claims are made that we could counter
    4. Missing narratives (things AI should say about us but doesn't)

    This produces the raw material for content generation.
    """
    own_brand_name = state["own_brand"].get("name", state["startup_name"])
    chats_summary = json.dumps(state.get("sample_chats", [])[:3], indent=2, default=str)

    prompt = f"""Analyze these AI engine responses about "{own_brand_name}" and its competitors.

CHAT DATA:
{chats_summary}

BRAND REPORT CONTEXT:
{json.dumps(state.get("brand_report", []), default=str)}

Extract:
1. How the brand is framed (positive, negative, neutral patterns and missing narratives)
2. How each competitor is framed (advantages, vulnerabilities, counter-narrative opportunities)
3. The overall category narrative
4. A strategic reframe recommendation"""

    narrative = invoke_llm_structured(
        messages=[
            SystemMessage(content="You are a brand strategist analyzing AI-generated content."),
            HumanMessage(content=prompt)
        ],
        output_schema=NarrativeAnalysis,
        generation_name="analyze_narrative"
    )

    return {
        "narrative_analysis": narrative,
        "current_step": ["narrative_analyzed"]
    }


# ═══════════════════════════════════════════════════════════════════════════
# NODE 8: SOURCE GAP MAPPING
# ═══════════════════════════════════════════════════════════════════════════
@traced_node("map_source_gaps")
def map_source_gaps(state: EdgeElevateState) -> dict:
    """
    Builds a detailed map of WHERE our brand is missing vs competitors.

    For each domain in the domain report:
    - Is our brand mentioned? Which competitors are?
    - What's the citation rate? (higher = more authoritative = higher priority)
    - What type of source is it? (editorial, UGC, reference)
    - What specific actions does Peec recommend for this source?

    This feeds directly into content strategy.
    """
    own_brand_id = state["own_brand"].get("id", "")
    domain_report = state.get("domain_report", [])
    brand_id_to_name = {b["id"]: b["name"] for b in state.get("brands", [])}

    source_gaps = {
        "missing_high_authority": [],   # high citation_rate, brand absent
        "present_low_impact": [],       # brand present but low citations
        "competitive_battlegrounds": [], # brand + competitors co-present
        "untapped_channels": []          # high retrieval, brand absent
    }

    for domain in domain_report:
        mentioned_ids = domain.get("mentioned_brand_ids", [])
        own_present = own_brand_id in mentioned_ids
        competitors_present = [
            brand_id_to_name.get(bid, bid)
            for bid in mentioned_ids
            if bid != own_brand_id
        ]

        entry = {
            "domain": domain.get("domain"),
            "classification": domain.get("classification"),
            "citation_rate": domain.get("citation_rate", 0),
            "citation_count": domain.get("citation_count", 0),
            "retrieved_percentage": domain.get("retrieved_percentage", 0),
            "own_brand_present": own_present,
            "competitors_present": competitors_present
        }

        citation_rate = domain.get("citation_rate", 0)

        if not own_present and citation_rate > 1.0:
            source_gaps["missing_high_authority"].append(entry)
        elif own_present and domain.get("citation_count", 0) < 20:
            source_gaps["present_low_impact"].append(entry)
        elif own_present and len(competitors_present) >= 2:
            source_gaps["competitive_battlegrounds"].append(entry)
        elif not own_present and domain.get("retrieved_percentage", 0) > 0.1:
            source_gaps["untapped_channels"].append(entry)

    # Sort each category by citation_rate descending
    for key in source_gaps:
        source_gaps[key].sort(key=lambda x: x["citation_rate"], reverse=True)

    return {
        "source_gap_map": source_gaps,
        "current_step": ["source_gaps_mapped"]
    }


# ═══════════════════════════════════════════════════════════════════════════
# NODE 9: CONTENT OPPORTUNITY ENGINE
# ═══════════════════════════════════════════════════════════════════════════
@traced_node("generate_content_opportunities")
def generate_content_opportunities(state: EdgeElevateState) -> dict:
    """
    Merges insights from:
    - Peec AI actions (drilldowns with specific targets)
    - Source gap map (where to be present)
    - Narrative analysis (what to say)
    - Search queries (what topics to target)
    - Displacement scores (who to target)

    Produces a ranked list of content opportunities with:
    - What to create (format + topic)
    - Where to publish/pitch
    - Who to target (which competitor to displace)
    - Why (data-backed reasoning)
    - Priority score
    """
    actions = state.get("actions_drilldowns", [])
    gaps = state.get("source_gap_map", {})
    narrative = state.get("narrative_analysis", {})
    search_queries = state.get("search_queries", [])
    displacement = state.get("competitive_displacement_scores", [])
    own_brand_name = state["own_brand"].get("name", state["startup_name"])

    prompt = f"""You are a content strategist for "{own_brand_name}", an early-stage brand.

Based on the data below, generate 10 ranked content opportunities.

PEEC AI RECOMMENDED ACTIONS:
{json.dumps(actions[:10], default=str)}

SOURCE GAPS (where brand is missing from high-authority sources):
{json.dumps(gaps.get("missing_high_authority", [])[:5], default=str)}

UNTAPPED CHANNELS:
{json.dumps(gaps.get("untapped_channels", [])[:5], default=str)}

NARRATIVE ANALYSIS:
{json.dumps(narrative, default=str)}

AI SEARCH QUERIES (what AI engines actually search for):
{json.dumps(search_queries[:15], default=str)}

COMPETITOR DISPLACEMENT SCORES (who to target):
{json.dumps(displacement[:3], default=str)}

For each opportunity, specify:
- Rank (1 = highest priority)
- Title (short name)
- Format (blog_post, video, linkedin_post, reddit_thread, guest_article, or infographic)
- Channel (specific site/platform to publish)
- Topic (specific angle)
- Target competitor (or 'general')
- Target query (the AI search query this content should appear for)
- Reasoning (1-2 sentences citing specific data)
- Priority score (0.0-1.0)
- Estimated effort (low, medium, or high)"""

    result = invoke_llm_structured(
        messages=[
            SystemMessage(content="You are a data-driven content strategist."),
            HumanMessage(content=prompt)
        ],
        output_schema=ContentOpportunitiesList,
        generation_name="generate_content_opportunities"
    )

    return {
        "content_opportunities": result["opportunities"],
        "current_step": ["content_opportunities_generated"]
    }


# ═══════════════════════════════════════════════════════════════════════════
# NODE 10: POSITIONING STATEMENT GENERATOR
# ═══════════════════════════════════════════════════════════════════════════
@traced_node("generate_positioning")
def generate_positioning(state: EdgeElevateState) -> dict:
    """
    Synthesizes all analysis into a refined positioning statement.
    This is the strategic north star that guides all content.
    """
    own_brand_name = state["own_brand"].get("name", state["startup_name"])

    prompt = f"""Based on the competitive analysis data below, craft a positioning statement
for "{own_brand_name}" that will help it win in AI-driven discovery.

BRAND METRICS (our brand vs competitors):
{json.dumps(state.get("brand_report", [])[:5], default=str)}

NARRATIVE ANALYSIS:
{json.dumps(state.get("narrative_analysis", {}), default=str)}

TOP DISPLACEMENT TARGETS:
{json.dumps(state.get("competitive_displacement_scores", [])[:3], default=str)}

Generate a JSON object:
{{
  "positioning_statement": "For [target audience] who [need/pain point], [brand] is the [category] that [key differentiator] unlike [key competitor], which [competitor limitation].",
  "key_differentiators": ["3-5 unique selling points backed by data"],
  "competitive_wedges": ["2-3 specific angles to split attention from competitors"],
  "elevator_pitch": "A 2-sentence pitch optimized for AI discoverability",
  "brand_narrative_arc": "A 3-act story structure for the brand"
}}

Return ONLY valid JSON."""

    response_content = invoke_llm([
        SystemMessage(content="You are a brand positioning expert. Return only valid JSON."),
        HumanMessage(content=prompt)
    ], generation_name="generate_positioning")

    try:
        cleaned = clean_llm_json_response(response_content)
        positioning = json.loads(cleaned)
        statement = positioning.get("positioning_statement", response_content)
    except json.JSONDecodeError:
        statement = response_content

    return {
        "positioning_statement": statement,
        "current_step": ["positioning_generated"]
    }


# ═══════════════════════════════════════════════════════════════════════════
# NODE 11: LINKEDIN CONTENT GENERATOR
# ═══════════════════════════════════════════════════════════════════════════
@traced_node("generate_linkedin_posts")
def generate_linkedin_posts(state: EdgeElevateState) -> dict:
    """
    Generates 3 LinkedIn post drafts, each with a different strategic angle:
    1. Data Insight Post — leads with a surprising finding from Peec data
    2. Founder Narrative Post — personal story tied to competitive positioning
    3. Product-Led Post — showcases product through lens of AI discoverability

    Each post is optimized for the queries AI engines actually search for.
    """
    own_brand_name = state["own_brand"].get("name", state["startup_name"])

    prompt = f"""Create 3 LinkedIn post drafts for "{own_brand_name}".

CONTEXT:
- Brand visibility in AI: {next((b.get("visibility", 0) for b in state.get("brand_report", []) if b.get("brand_id") == state["own_brand"].get("id")), "N/A")}
- Top competitor: {state.get("competitive_displacement_scores", [{}])[0].get("competitor_name", "N/A") if state.get("competitive_displacement_scores") else "N/A"}
- Key narrative opportunity: {state.get("narrative_analysis", {}).get("strategic_reframe", "N/A")}
- Top content opportunity: {state.get("content_opportunities", [{}])[0].get("title", "N/A") if state.get("content_opportunities") else "N/A"}
- Positioning: {state.get("positioning_statement", "N/A")}

TARGET SEARCH QUERIES (embed these naturally):
{json.dumps([q.get("query", "") for q in state.get("search_queries", [])[:5]], default=str)}

Generate a JSON array of 3 posts:
[
  {{
    "type": "data_insight",
    "hook": "First line that stops the scroll",
    "body": "Full post body (300-500 words). Use line breaks for readability.",
    "cta": "Call to action",
    "hashtags": ["3-5 relevant hashtags"],
    "target_query": "The AI query this is designed to surface for"
  }},
  {{
    "type": "founder_narrative",
    ...
  }},
  {{
    "type": "product_led",
    ...
  }}
]

Return ONLY a JSON array."""

    response_content = invoke_llm([
        SystemMessage(content="You are a LinkedIn content expert. Return only valid JSON."),
        HumanMessage(content=prompt)
    ], generation_name="generate_linkedin_posts")

    try:
        cleaned = clean_llm_json_response(response_content)
        posts = json.loads(cleaned)
    except json.JSONDecodeError:
        posts = [{"raw": response_content, "parse_error": True}]

    return {
        "linkedin_posts": posts,
        "current_step": ["linkedin_posts_generated"]
    }


# ═══════════════════════════════════════════════════════════════════════════
# NODE 12: VIDEO SCRIPT GENERATOR
# ═══════════════════════════════════════════════════════════════════════════
@traced_node("generate_video_script")
def generate_video_script(state: EdgeElevateState) -> dict:
    """
    Creates a video script optimized for YouTube discovery by AI engines.

    From our Peec exploration:
    - YouTube is the #1 cited source (270 citations, 32% retrieval rate)
    - AI engines search for specific topics like "18 coolest gadgets workspace productivity"
    - Video titles and descriptions directly influence AI citations

    The script is designed to be the kind of content AI engines retrieve and cite.
    """
    own_brand_name = state["own_brand"].get("name", state["startup_name"])

    # Pick the best video opportunity from content opportunities
    video_opps = [
        o for o in state.get("content_opportunities", [])
        if o.get("format") == "video"
    ]
    if not video_opps:
        video_opps = state.get("content_opportunities", [{}])[:1]

    prompt = f"""Create a YouTube video script for "{own_brand_name}".

VIDEO OPPORTUNITY:
{json.dumps(video_opps[0] if video_opps else {{}}, default=str)}

POSITIONING:
{state.get("positioning_statement", "N/A")}

AI SEARCH QUERIES TO TARGET:
{json.dumps([q.get("query", "") for q in state.get("search_queries", [])[:8]], default=str)}

COMPETITOR CONTEXT (mention and compare against):
{json.dumps(state.get("competitive_displacement_scores", [])[:3], default=str)}

Generate a JSON object:
{{
  "title": "Video title optimized for AI discoverability",
  "description": "YouTube description with keywords",
  "duration_minutes": 8,
  "sections": [
    {{
      "timestamp": "0:00",
      "section_name": "Hook",
      "script": "Exact words to say",
      "visual_notes": "What to show on screen",
      "duration_seconds": 30
    }}
  ],
  "tags": ["youtube tags for discoverability"],
  "thumbnail_concept": "Description of thumbnail design"
}}

Return ONLY valid JSON."""

    response_content = invoke_llm([
        SystemMessage(content="You are a YouTube content strategist. Return only valid JSON."),
        HumanMessage(content=prompt)
    ], generation_name="generate_video_script")

    try:
        cleaned = clean_llm_json_response(response_content)
        video_script = json.loads(cleaned)  # Return as object, not string
    except json.JSONDecodeError:
        video_script = {"raw": response_content, "parse_error": True}

    return {
        "video_script": video_script,
        "current_step": ["video_script_generated"]
    }


# ═══════════════════════════════════════════════════════════════════════════
# NODE 13: REPORT ASSEMBLY
# ═══════════════════════════════════════════════════════════════════════════
@traced_node("assemble_report")
def assemble_report(state: EdgeElevateState) -> dict:
    """
    Assembles the final comprehensive report in markdown.
    This is the primary deliverable — a complete competitive displacement playbook.
    """
    own_brand_name = state["own_brand"].get("name", state["startup_name"])

    prompt = f"""Create a comprehensive competitive displacement report for "{own_brand_name}".

Use ALL of the following data to create a structured, insightful report:

BRAND METRICS:
{json.dumps(state.get("brand_report", []), default=str)}

COMPETITIVE DISPLACEMENT SCORES:
{json.dumps(state.get("competitive_displacement_scores", []), default=str)}

SOURCE GAP MAP:
{json.dumps(state.get("source_gap_map", {}), default=str)}

NARRATIVE ANALYSIS:
{json.dumps(state.get("narrative_analysis", {}), default=str)}

PEEC AI ACTIONS:
{json.dumps(state.get("actions_drilldowns", [])[:8], default=str)}

CONTENT OPPORTUNITIES:
{json.dumps(state.get("content_opportunities", [])[:5], default=str)}

POSITIONING:
{state.get("positioning_statement", "N/A")}

Structure the report as markdown with these sections:

# EdgeElevate Report: [Brand Name]

## Executive Summary
(3-4 sentence overview of key findings and recommended strategy)

## 1. Competitive Landscape
(Visibility, sentiment, share of voice rankings with analysis)

## 2. Competitive Displacement Analysis
(For each competitor: displacement score, why, specific actions)

## 3. Source Intelligence
(Which domains matter, where brand is missing, citation authority)

## 4. Narrative Gap Analysis
(How AI describes the brand vs how it SHOULD describe it)

## 5. Content Strategy Playbook
(Top 5 content actions ranked by impact, with specific targets)

## 6. Positioning & Messaging
(Final positioning statement, key differentiators, elevator pitch)

## 7. 30-Day Action Plan
(Week-by-week prioritized actions)

Make it data-rich, actionable, and specific. Use tables where appropriate.
Reference specific numbers from the data provided."""

    report_content = invoke_llm([
        SystemMessage(content="You are a strategic analyst creating an executive-ready competitive report."),
        HumanMessage(content=prompt)
    ], generation_name="assemble_report")

    # Also generate a short executive summary
    exec_prompt = f"""In exactly 4 sentences, summarize the key finding and recommended action for "{own_brand_name}" based on:
- Visibility: {next((b.get("visibility", 0) for b in state.get("brand_report", []) if b.get("brand_id") == state["own_brand"].get("id")), "N/A")}
- Top displacement target: {state.get("competitive_displacement_scores", [{}])[0].get("competitor_name", "N/A") if state.get("competitive_displacement_scores") else "N/A"}
- Biggest gap: {state.get("actions_overview", [{}])[0].get("action_group_type", "N/A") if state.get("actions_overview") else "N/A"}
- Sentiment score: {next((b.get("sentiment", 0) for b in state.get("brand_report", []) if b.get("brand_id") == state["own_brand"].get("id")), "N/A")}"""

    exec_summary = invoke_llm([HumanMessage(content=exec_prompt)], generation_name="executive_summary")

    return {
        "report_markdown": report_content,
        "executive_summary": exec_summary,
        "current_step": ["report_assembled"]
    }


# ---------------------------------------------------------------------------
# 4. GRAPH CONSTRUCTION
# ---------------------------------------------------------------------------

def should_continue_after_resolve(state: EdgeElevateState) -> list[str] | str:
    """Router: check if project was resolved successfully.

    Returns a list of node names for parallel execution of:
    - Path A: Brand Intelligence (fetch_brand_intelligence)
    - Path B: Source Intelligence (fetch_source_intelligence)
    - Path C: Actions Overview (fetch_actions)
    """
    if state.get("project_id"):
        # Fan out to three parallel paths
        return ["fetch_brand_intelligence", "fetch_source_intelligence", "fetch_actions"]
    return "end"


def build_graph() -> StateGraph:
    """
    Builds the LangGraph workflow.

    Flow:
    ┌─────────────────────┐
    │   resolve_project   │
    └──────────┬──────────┘
               │ (project_id resolved)
               │
       ┌───────┼───────┐
       │       │       │  (parallel execution)
       ▼       ▼       ▼
    ┌──────┐┌──────┐┌──────┐
    │Path A││Path B││Path C│
    │Brand ││Source││Actions│
    │Intel ││Intel ││Overv. │
    └──┬───┘└──┬───┘└──┬───┘
       │       │       │
       └───────┼───────┘
               │ (join)
               ▼
    ┌────────────────────────────┐
    │     analyze_chats          │
    └────────────────────────────┘
               │
               ▼
    ┌────────────────────────────────────────┐
    │   compute_displacement_scores          │
    └────────────────────────────────────────┘
            │
            ├──────────────────┐
            ▼                  ▼
    ┌──────────────┐   ┌──────────────────┐
    │ analyze_     │   │  map_source_gaps  │
    │ narrative    │   └──────────────────┘
    └──────────────┘           │
            │                  │
            ├──────────────────┘
            ▼
    ┌────────────────────────────────────────┐
    │   generate_content_opportunities       │
    └────────────────────────────────────────┘
            │
            ├──────────────────┬──────────────────┐
            ▼                  ▼                  ▼
    ┌──────────────┐  ┌────────────────┐  ┌──────────────┐
    │ generate_    │  │ generate_      │  │ generate_    │
    │ positioning  │  │ linkedin_posts │  │ video_script │
    └──────────────┘  └────────────────┘  └──────────────┘
            │                  │                  │
            ├──────────────────┴──────────────────┘
            ▼
    ┌────────────────────────────────────────┐
    │         assemble_report                │
    └────────────────────────────────────────┘
            │
            ▼
          [END]
    """
    workflow = StateGraph(EdgeElevateState)

    # Add all nodes
    workflow.add_node("resolve_project", resolve_project)
    workflow.add_node("fetch_brand_intelligence", fetch_brand_intelligence)
    workflow.add_node("fetch_source_intelligence", fetch_source_intelligence)
    workflow.add_node("fetch_actions", fetch_actions)
    workflow.add_node("analyze_chats", analyze_chats)
    workflow.add_node("compute_displacement_scores", compute_displacement_scores)
    workflow.add_node("analyze_narrative", analyze_narrative)
    workflow.add_node("map_source_gaps", map_source_gaps)
    workflow.add_node("generate_content_opportunities", generate_content_opportunities)
    workflow.add_node("generate_positioning", generate_positioning)
    workflow.add_node("generate_linkedin_posts", generate_linkedin_posts)
    workflow.add_node("generate_video_script", generate_video_script)
    workflow.add_node("assemble_report", assemble_report)

    # Set entry point
    workflow.set_entry_point("resolve_project")

    # Conditional edge after project resolution - fans out to 3 parallel paths
    workflow.add_conditional_edges(
        "resolve_project",
        should_continue_after_resolve,
        {
            # Path A: Brand Intelligence
            "fetch_brand_intelligence": "fetch_brand_intelligence",
            # Path B: Source Intelligence
            "fetch_source_intelligence": "fetch_source_intelligence",
            # Path C: Actions Overview
            "fetch_actions": "fetch_actions",
            "end": END
        }
    )

    # All three parallel paths converge at analyze_chats
    # LangGraph will wait for all incoming edges before executing analyze_chats
    workflow.add_edge("fetch_brand_intelligence", "analyze_chats")
    workflow.add_edge("fetch_source_intelligence", "analyze_chats")
    workflow.add_edge("fetch_actions", "analyze_chats")

    # After all data is fetched, compute derived analysis
    workflow.add_edge("analyze_chats", "compute_displacement_scores")

    # Parallel analysis (sequential here, parallel with branches if needed)
    workflow.add_edge("compute_displacement_scores", "analyze_narrative")
    workflow.add_edge("analyze_narrative", "map_source_gaps")

    # Content strategy depends on all analysis
    workflow.add_edge("map_source_gaps", "generate_content_opportunities")

    # Content generation can be parallel (sequential here)
    workflow.add_edge("generate_content_opportunities", "generate_positioning")
    workflow.add_edge("generate_positioning", "generate_linkedin_posts")
    workflow.add_edge("generate_linkedin_posts", "generate_video_script")

    # Final assembly
    workflow.add_edge("generate_video_script", "assemble_report")
    workflow.add_edge("assemble_report", END)

    return workflow.compile()


# ---------------------------------------------------------------------------
# 5. EXECUTION
# ---------------------------------------------------------------------------

@observe(name="edge_elevate_pipeline", as_type="generation")
def run_edge_elevate(startup_name: str) -> EdgeElevateState:
    """
    Main entry point. Takes a startup name and runs the full pipeline.

    Usage:
        result = run_edge_elevate("Nothing Phone")
        print(result["report_markdown"])
        print(result["linkedin_posts"])
        print(result["video_script"])
    """
    graph = build_graph()

    initial_state: EdgeElevateState = {
        "startup_name": startup_name,
        "project_id": "",
        "brands": [],
        "own_brand": {},
        "competitor_brands": [],
        "brand_report": [],
        "domain_report": [],
        "actions_overview": [],
        "actions_drilldowns": [],
        "search_queries": [],
        "sample_chats": [],
        "prompts": [],
        "competitive_displacement_scores": [],
        "narrative_analysis": {},
        "source_gap_map": {},
        "content_opportunities": [],
        "positioning_statement": "",
        "report_markdown": "",
        "linkedin_posts": [],
        "video_script": "",
        "executive_summary": "",
        "errors": [],
        "current_step": ["initialized"]
    }

    # Execute the graph
    final_state = graph.invoke(initial_state)

    # Flush Langfuse to ensure all events are sent (flushes the @observe decorator's internal client)
    if LANGFUSE_ENABLED:
        get_langfuse_client().flush()

    return final_state


# ---------------------------------------------------------------------------
# 6. CLI ENTRY POINT
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import sys

    startup = sys.argv[1] if len(sys.argv) > 1 else "Nothing Phone"
    print(f"\n{'='*60}")
    print(f"  EdgeElevate: Competitive Intelligence Orchestrated for Distribution")
    print(f"  Analyzing: {startup}")
    print(f"{'='*60}\n")

    result = run_edge_elevate(startup)

    if result.get("errors"):
        print(f"⚠️  Errors encountered: {result['errors']}")

    if result.get("executive_summary"):
        print(f"\n📊 EXECUTIVE SUMMARY:\n{result['executive_summary']}\n")

    if result.get("report_markdown"):
        # Save report
        with open("edge_elevate_report.md", "w") as f:
            f.write(result["report_markdown"])
        print("📄 Full report saved to: edge_elevate_report.md")

    if result.get("linkedin_posts"):
        with open("linkedin_posts.json", "w") as f:
            json.dump(result["linkedin_posts"], f, indent=2)
        print("📱 LinkedIn posts saved to: linkedin_posts.json")

    if result.get("video_script"):
        with open("video_script.json", "w") as f:
            f.write(result["video_script"])
        print("🎬 Video script saved to: video_script.json")

    print(f"\n✅ Pipeline complete. Final step: {result.get('current_step')}")