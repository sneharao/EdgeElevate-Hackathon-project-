from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse
from pydantic import BaseModel
from typing import Optional
import json
import asyncio
import httpx
import os
from elevate_edge_graph import build_graph, EdgeElevateState

# Hera API configuration
HERA_API_KEY = os.getenv("HERA_API_KEY", "")
HERA_API_BASE = "https://api.hera.video/v1"

# Nothing Phone brand colors
NOTHING_BRAND = {
    "primary": "#000000",
    "secondary": "#FFFFFF",
    "accent": "#D71921",
    "name": "Nothing"
}

app = FastAPI()

# Allow frontend URLs - add your Render frontend URL to ALLOWED_ORIGINS env var
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

STEP_NAMES = {
    # Step 1: Context
    "resolve_project": "resolve_project",
    "resolve_project_label": "Identifying Brand Context",
    
    # Step 2: Research
    "fetch_brand_intelligence": "fetch_brand_intelligence",
    "fetch_source_intelligence": "fetch_brand_intelligence",
    "fetch_actions": "fetch_brand_intelligence",
    "analyze_chats": "fetch_brand_intelligence",
    "fetch_brand_intelligence_label": "Analyzing Competitors",
    
    # Step 3: Analysis
    "compute_displacement_scores": "compute_displacement_scores",
    "analyze_narrative": "compute_displacement_scores",
    "map_source_gaps": "compute_displacement_scores",
    "compute_displacement_scores_label": "Spotting Opportunities",
    
    # Step 4: Generation
    "generate_content_opportunities": "generate_linkedin_posts",
    "generate_positioning": "generate_linkedin_posts",
    "generate_linkedin_posts": "generate_linkedin_posts",
    "generate_video_script": "generate_linkedin_posts",
    "assemble_report": "generate_linkedin_posts",
    "generate_linkedin_posts_label": "Crafting Content",
}

@app.get("/api/edge-elevate/stream")
async def analyze_stream(startup_name: str = Query(...)):
    async def event_generator():
        try:
            compiled_graph = build_graph()

            # Initialize full state to ensure all keys exist for nodes and reducers
            initial_state = {
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

            last_ui_step = None
            final_state = initial_state.copy()

            async for event in compiled_graph.astream(initial_state, stream_mode="updates"):
                for node_name, update in event.items():
                    # Accumulate state
                    for key, value in update.items():
                        if key == "errors" and key in final_state:
                            final_state[key].extend(value)
                        elif key == "current_step" and key in final_state:
                            final_state[key].extend(value)
                        else:
                            final_state[key] = value

                    # Map internal node to UI step
                    ui_step = STEP_NAMES.get(node_name, node_name)
                    if ui_step != last_ui_step:
                        yield {
                            "event": "step",
                            "data": json.dumps({
                                "step": ui_step,
                                "label": STEP_NAMES.get(f"{ui_step}_label", ui_step)
                            })
                        }
                        last_ui_step = ui_step

            # Final result - serialize state properly
            if final_state:
                # Convert state to JSON-serializable format
                result = {
                    "startup_name": final_state.get("startup_name", ""),
                    "brand_report": final_state.get("brand_report", []),
                    "own_brand": final_state.get("own_brand", {}),
                    "competitor_brands": final_state.get("competitor_brands", []),
                    "competitive_displacement_scores": final_state.get("competitive_displacement_scores", []),
                    "source_gap_map": final_state.get("source_gap_map", {}),
                    "content_opportunities": final_state.get("content_opportunities", []),
                    "narrative_analysis": final_state.get("narrative_analysis", {}),
                    "positioning_statement": final_state.get("positioning_statement", ""),
                    "linkedin_posts": final_state.get("linkedin_posts", []),
                    "video_script": final_state.get("video_script", ""),
                    "executive_summary": final_state.get("executive_summary", ""),
                    "errors": final_state.get("errors", []),
                }

                yield {
                    "event": "complete",
                    "data": json.dumps(result)
                }
        except Exception as e:
            print(f"STREAM ERROR: {str(e)}")
            yield {
                "event": "error",
                "data": json.dumps({"error": str(e)})
            }

    return EventSourceResponse(event_generator())


# # ═══════════════════════════════════════════════════════════════════════════
# # HERA VIDEO GENERATION ENDPOINTS
# # ═══════════════════════════════════════════════════════════════════════════

# class VideoGenerationRequest(BaseModel):
#     video_script: dict
#     brand_name: str = "Nothing"


# @app.post("/api/generate-video")
# async def generate_video(request: VideoGenerationRequest):
#     """
#     Generate a video using Hera API from video script sections.
#     Returns a job_id for polling.
#     """
#     if not HERA_API_KEY:
#         raise HTTPException(
#             status_code=500,
#             detail="HERA_API_KEY not configured. Set environment variable: export HERA_API_KEY='your-key'"
#         )

#     if not request.video_script:
#         raise HTTPException(status_code=400, detail="video_script is required")

#     script = request.video_script
#     sections = script.get("sections", [])

#     # Build prompt from script sections with brand styling
#     prompt_parts = [
#         f"Create a professional motion graphics video for {request.brand_name}.",
#         f"Title: {script.get('title', 'Brand Video')}",
#         f"Style: Modern, minimal, tech-forward with brand colors:",
#         f"  - Primary: {NOTHING_BRAND['primary']} (black)",
#         f"  - Secondary: {NOTHING_BRAND['secondary']} (white)",
#         f"  - Accent: {NOTHING_BRAND['accent']} (red)",
#         "",
#         "Sections:"
#     ]

#     for section in sections:
#         prompt_parts.append(
#             f"[{section.get('timestamp', '0:00')}] {section.get('section_name', 'Section')}: "
#             f"{section.get('visual_notes', section.get('script', '')[:100])}"
#         )

#     prompt = "\n".join(prompt_parts)

#     async with httpx.AsyncClient() as client:
#         try:
#             response = await client.post(
#                 f"{HERA_API_BASE}/videos",
#                 headers={
#                     "x-api-key": HERA_API_KEY,
#                     "Content-Type": "application/json"
#                 },
#                 json={
#                     "prompt": prompt,
#                     "aspectRatio": "16:9",
#                     "duration": min(script.get("duration_minutes", 1) * 60, 60)  # Cap at 60s for demo
#                 },
#                 timeout=30.0
#             )
#             response.raise_for_status()
#             data = response.json()
#             return {"job_id": data.get("id"), "status": "processing"}
#         except httpx.HTTPStatusError as e:
#             print(f"Hera API error: {e.response.status_code} - {e.response.text}")
#             raise HTTPException(status_code=e.response.status_code, detail=f"Hera API error: {str(e)}")
#         except Exception as e:
#             print(f"Error: {type(e).__name__}: {str(e)}")
#             raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


# @app.get("/api/video-status/{job_id}")
# async def get_video_status(job_id: str):
#     """
#     Poll for video generation status.
#     Returns status and video_url when complete.
#     """
#     if not HERA_API_KEY:
#         raise HTTPException(status_code=500, detail="HERA_API_KEY not configured")

#     async with httpx.AsyncClient() as client:
#         try:
#             response = await client.get(
#                 f"{HERA_API_BASE}/videos/{job_id}",
#                 headers={"x-api-key": HERA_API_KEY},
#                 timeout=10.0
#             )
#             response.raise_for_status()
#             data = response.json()

#             status = data.get("status", "processing")
#             result = {"job_id": job_id, "status": status}

#             if status == "completed":
#                 result["video_url"] = data.get("url") or data.get("output", {}).get("url")

#             return result
#         except httpx.HTTPStatusError as e:
#             print(f"Hera API error: {e.response.status_code} - {e.response.text}")
#             raise HTTPException(status_code=e.response.status_code, detail=f"Hera API error: {str(e)}")
#         except Exception as e:
#             print(f"Error: {type(e).__name__}: {str(e)}")
#             raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
