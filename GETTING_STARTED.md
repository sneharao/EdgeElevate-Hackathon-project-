# Getting Started with EdgeElevate

This guide will help you set up and run the EdgeElevate notebooks to test each API integration before building the full workflow.

## What We've Built

### 📓 Notebooks Created

1. **`notebooks/api_integration_tests.ipynb`**
   - Tests each API individually
   - Verifies API keys are working
   - Shows example requests/responses for:
     - Peec AI (competitor analysis)
     - Tavily (review scraping)
     - Q-Context (insight structuring)
     - Hera (video generation)
     - OpenRouter (LLM operations)

2. **`notebooks/edge_elevate_complete_workflow.ipynb`**
   - Full end-to-end EdgeElevate workflow
   - Integrates all APIs into a cohesive pipeline
   - Generates complete competitive analysis report
   - Produces video scripts and LinkedIn posts
   - Exports structured JSON report

### 🔧 Configuration Files

- **`.env.example`** - Template for API keys (updated with all required services)
- **`notebooks/requirements.txt`** - Python dependencies
- **`notebooks/README.md`** - Detailed notebook documentation
- **`setup_notebooks.sh`** - Automated setup script

## Quick Start (5 Minutes)

### Step 1: Run Setup Script

```bash
./setup_notebooks.sh
```

This will:
- Create a Python virtual environment
- Install all dependencies
- Create `.env` file from template
- Create `outputs` directory

### Step 2: Add API Keys

Edit the `.env` file and add your API keys:

```bash
# Required (minimum to run workflow)
OPENROUTER_API_KEY="your_openrouter_key"
TAVILY_API_KEY="your_tavily_key"

# Optional (have fallbacks to OpenRouter)
PEEC_API_KEY="your_peec_key"
QCONTEXT_API_KEY="your_qcontext_key"
HERA_API_KEY="your_hera_key"
```

#### Where to Get API Keys

| Service | URL | Free Tier | Required |
|---------|-----|-----------|----------|
| OpenRouter | https://openrouter.ai/keys | Yes (limited) | ✅ Yes |
| Tavily | https://tavily.com | Yes | ✅ Yes |
| Peec AI | https://app.peec.ai/api-keys | No (Enterprise) | ❌ Optional |
| Q-Context | https://app.qontext.ai | Yes | ❌ Optional |
| Hera | support@hera.video | Contact for access | ❌ Optional |

**Note**: The workflow will work with just OpenRouter and Tavily. The others have automatic fallbacks.

### Step 3: Start Jupyter

```bash
source venv/bin/activate  # Activate virtual environment
jupyter notebook          # Or: jupyter lab
```

### Step 4: Test API Integrations

1. Open `notebooks/api_integration_tests.ipynb`
2. Run all cells (Cell → Run All)
3. Check the summary at the end to see which APIs are working

### Step 5: Run Full Workflow

1. Open `notebooks/edge_elevate_complete_workflow.ipynb`
2. Update the startup name in cell 3:
   ```python
   user_input = UserInput(
       startup_name="Your Startup Name",  # Change this
       industry="Your Industry",
       target_audience="Your Target Audience"
   )
   ```
3. Run all cells (Cell → Run All)
4. Find your report in `outputs/edgeelevate_report_*.json`

## Understanding the Workflow

### Data Flow

```
┌─────────────────┐
│   User Input    │
│  (Startup Name) │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  Competitor Analysis    │ ◄── Peec AI or OpenRouter
│  (Top competitors +     │
│   positioning data)     │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Sentiment Analysis      │ ◄── Tavily (Web Search)
│ (Reviews from           │
│  Trustpilot, G2, etc.)  │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Insight Structuring    │ ◄── Q-Context or OpenRouter
│  (Organized analysis +  │
│   opportunities)        │
└────────┬────────────────┘
         │
         ├──────────────────┐
         │                  │
         ▼                  ▼
┌──────────────────┐  ┌────────────────┐
│  Video Script    │  │ LinkedIn Posts │ ◄── OpenRouter
│  Generation      │  │  (3 variants)  │
└─────────┬────────┘  └────────┬───────┘
          │                    │
          ▼                    │
┌─────────────────┐            │
│ Video Creation  │ ◄── Hera  │
│   (Optional)    │            │
└─────────┬───────┘            │
          │                    │
          └──────────┬─────────┘
                     │
                     ▼
            ┌─────────────────┐
            │  Final Report   │
            │  (JSON Export)  │
            └─────────────────┘
```

### Output Structure

The workflow generates a comprehensive JSON report with:

```json
{
  "metadata": { ... },
  "company_overview": { ... },
  "competitive_landscape": {
    "competitors": [...],
    "market_analysis": { ... }
  },
  "strength_analysis": {
    "core_strengths": [...],
    "unique_capabilities": "..."
  },
  "weakness_analysis": {
    "narrative_gaps": [...],
    "opportunities": [...]
  },
  "positioning": {
    "value_proposition": "...",
    "differentiation": "...",
    "target_audience": "..."
  },
  "content_deliverables": {
    "video_script": {
      "script": "...",
      "visual_cues": [...],
      "duration_estimate": "..."
    },
    "linkedin_posts": {
      "posts": [
        {
          "type": "market_insight",
          "content": "...",
          "hashtags": [...]
        },
        ...
      ]
    }
  }
}
```

## Customization

### Using Different LLM Models

In the workflow notebook, you can change the OpenRouter model:

```python
payload = {
    "model": "google/gemini-2.0-flash-exp:free",  # Free tier
    # Or try:
    # "model": "meta-llama/llama-3.2-3b-instruct",  # Very cheap
    # "model": "anthropic/claude-3.5-sonnet",       # Higher quality
    "messages": [...]
}
```

### Adjusting Search Parameters

For Tavily searches, modify:

```python
payload = {
    "search_depth": "advanced",  # or "basic" for faster/cheaper
    "max_results": 5,            # Increase for more data
    "include_domains": [...],    # Target specific sites
}
```

### Skipping Optional Steps

Video generation via Hera can be skipped (it's commented out by default):

```python
# Uncomment to enable video generation
# video_result = video_generation_node(video_script)
```

## Troubleshooting

### "API key not configured" errors
- Check `.env` file exists in project root
- Verify API keys are correct (no quotes in .env)
- Restart Jupyter kernel after editing .env

### Rate limit errors
- OpenRouter free tier has limits
- Add delays between requests:
  ```python
  import time
  time.sleep(2)  # Wait 2 seconds
  ```

### Missing dependencies
```bash
source venv/bin/activate
pip install -r notebooks/requirements.txt
```

### Notebooks not loading
- Ensure Jupyter is running from project root
- Check virtual environment is activated

## Next Steps

Once the notebooks are working:

1. **Experiment**: Try different startups and compare results
2. **Refine**: Adjust prompts to improve output quality
3. **Extend**: Add new data sources or analysis steps
4. **Productionize**: Convert to LangGraph workflow (see main README)
5. **Deploy**: Build backend API and React frontend

## API Cost Estimates

Based on a single workflow run:

| Service | Approximate Cost | Notes |
|---------|------------------|-------|
| OpenRouter (Gemini Free) | $0.00 | Free tier, rate limited |
| OpenRouter (Llama 3.2) | $0.001-0.005 | Very cheap |
| Tavily | $0.00 | Free tier: 1000 searches/month |
| Peec AI | N/A | Enterprise pricing |
| Q-Context | $0.00 | Free tier available |
| Hera | Contact | Custom pricing |

**Total for MVP workflow**: ~$0.00 - $0.01 per run (using free tiers)

## Support & Documentation

- **Notebook Docs**: `notebooks/README.md`
- **API Docs**:
  - Peec AI: https://docs.peec.ai
  - Q-Context: https://docs.qontext.ai
  - Hera: https://docs.hera.video
  - Tavily: https://docs.tavily.com
  - OpenRouter: https://openrouter.ai/docs

## Contributing

Found a bug or want to improve the workflow?

1. Test your changes in the notebooks first
2. Document any new API integrations
3. Update requirements.txt if adding dependencies
4. Share your improvements!

---

**Ready to elevate your competitive positioning? Let's go! 🚀**
