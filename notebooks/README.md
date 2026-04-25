# EdgeElevate Notebooks

This directory contains Jupyter notebooks for testing and running the EdgeElevate workflow.

## Notebooks Overview

### 1. `api_integration_tests.ipynb`
**Purpose**: Test each API integration separately before building the full workflow.

**Tests**:
- ✅ Peec AI - Competitor analysis and brand visibility
- ✅ Tavily - Review scraping from Trustpilot, G2, Reddit
- ✅ Q-Context - Data ingestion and insight retrieval
- ✅ Hera - Video generation
- ✅ OpenRouter - LLM operations for content generation

**Usage**: Run this notebook first to verify all API keys are working correctly.

### 2. `edge_elevate_complete_workflow.ipynb`
**Purpose**: Complete end-to-end EdgeElevate workflow with real API integrations.

**Workflow Steps**:
1. User Input (startup name and parameters)
2. Competitor Analysis (Peec AI or OpenRouter fallback)
3. Public Sentiment Analysis (Tavily)
4. Insight Structuring (Q-Context or OpenRouter fallback)
5. Video Script Generation (OpenRouter)
6. Video Generation (Hera - optional)
7. LinkedIn Content Generation (OpenRouter)
8. Final Report Generation and Export

**Deliverables**:
- Structured competitive analysis report
- Market positioning insights
- Professional video script
- 3 LinkedIn post drafts
- JSON report export

### 3. Legacy Files
- `edge_elevate_workflow.ipynb` - Initial prototype (deprecated)
- `edge_flows.ipnyb` - Mock workflow example (deprecated)

## Setup Instructions

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure API Keys

Copy `.env.example` to `.env` and add your API keys:

```bash
cp ../.env.example ../.env
```

Edit `.env` and add your keys:

```bash
# Required
OPENROUTER_API_KEY="your_key_here"
TAVILY_API_KEY="your_key_here"

# Optional (with fallbacks)
PEEC_API_KEY="your_key_here"         # Falls back to OpenRouter
QCONTEXT_API_KEY="your_key_here"     # Falls back to OpenRouter
HERA_API_KEY="your_key_here"         # Optional video generation
```

### 3. Get API Keys

| Service | URL | Notes |
|---------|-----|-------|
| **OpenRouter** | https://openrouter.ai/keys | Required - used for LLM operations |
| **Tavily** | https://tavily.com | Required - for web search and reviews |
| **Peec AI** | https://app.peec.ai/api-keys | Optional - Enterprise tier, has fallback |
| **Q-Context** | https://app.qontext.ai | Optional - has OpenRouter fallback |
| **Hera** | Contact support@hera.video | Optional - for video generation |

### 4. Run Notebooks

```bash
# Start Jupyter
jupyter notebook

# Or use Jupyter Lab
jupyter lab
```

## Workflow Usage

### Quick Start (5 minutes)

1. Open `api_integration_tests.ipynb`
2. Run all cells to verify API connections
3. Check which APIs are working (you need at least OpenRouter + Tavily)

### Full Workflow (15-20 minutes)

1. Open `edge_elevate_complete_workflow.ipynb`
2. Update the startup name in the "User Input" cell:
   ```python
   user_input = UserInput(
       startup_name="Your Startup Name",
       industry="Your Industry",
       target_audience="Your Target Audience"
   )
   ```
3. Run all cells sequentially
4. Find your report in `../outputs/edgeelevate_report_*.json`

## API Fallback Strategy

The workflow is designed to be resilient:

- **Peec AI**: Falls back to OpenRouter LLM for competitor analysis
- **Q-Context**: Falls back to OpenRouter LLM for insight structuring
- **Hera**: Video generation is optional (script still generated)

**Minimum Requirements**: OpenRouter + Tavily API keys will run the full workflow.

## Output Structure

```json
{
  "metadata": {
    "startup_name": "...",
    "generated_at": "...",
    "workflow_version": "1.0"
  },
  "company_overview": {...},
  "competitive_landscape": {...},
  "strength_analysis": {...},
  "weakness_analysis": {...},
  "positioning": {...},
  "content_deliverables": {
    "video_script": {...},
    "linkedin_posts": {...}
  }
}
```

## Troubleshooting

### API Key Issues
- Verify keys are in `.env` file
- Check key format (no quotes in .env values after `=`)
- Ensure `.env` is in the project root directory

### Import Errors
- Run `pip install -r requirements.txt`
- Use a virtual environment if possible

### API Rate Limits
- OpenRouter: Free tier has limits, consider paid tier
- Tavily: Check your plan's request limits
- Add delays between requests if hitting limits

### Missing Data
- Some APIs may return partial data
- Check error messages in notebook output
- Fallbacks should activate automatically

## Model Selection for Cost Optimization

The notebooks use cost-effective models via OpenRouter:

- **Primary**: `google/gemini-2.0-flash-exp:free` (free tier)
- **Alternative**: `meta-llama/llama-3.2-3b-instruct` (very cheap)
- **Premium**: `anthropic/claude-3.5-sonnet` (better quality, higher cost)

Update the `model` parameter in OpenRouter calls to switch models.

## Next Steps

After running the notebooks successfully:

1. **Backend Integration**: Port notebook logic to Python modules
2. **LangGraph Implementation**: Convert to stateful workflow graphs
3. **Frontend Development**: Build React dashboard to display reports
4. **Deployment**: Containerize and deploy to cloud (AWS/GCP)
5. **Observability**: Add OpenTelemetry and Jaeger tracing

## Support

For issues or questions:
- API Documentation: Check individual service docs (links above)
- Workflow Questions: Review the main project README
- Bugs: Open an issue in the repository
