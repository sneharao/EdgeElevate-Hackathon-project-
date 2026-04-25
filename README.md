# EdgeElevate

> AI-powered competitive displacement engine for startups to identify narrative gaps and amplify market presence.

EdgeElevate analyzes your competitive landscape, extracts sentiment from user reviews, identifies strategic positioning gaps, and generates ready-to-use content to help your startup stand out.

## What It Does

EdgeElevate runs a 4-stage AI analysis pipeline to give you actionable competitive intelligence:

1. **Competitor Analysis (Peec AI)** - Identifies your top 3 competitors, their positioning, messaging, strengths, and weaknesses
2. **Sentiment Analysis** - Scrapes and analyzes user reviews from Trustpilot/G2 to extract pain points and highlights
3. **Insight Structuring (Q-Context)** - Synthesizes research into strategic narrative with value proposition, differentiation angles, and SWOT analysis
4. **Content Generation (HERA)** - Produces CEO-level video script and 3 LinkedIn posts ready for publication

## Features

- **Competitor Topology Mapping** - Visual representation of your competitive landscape
- **Sentiment Spectrum Analysis** - Pie charts and trend analysis from user reviews
- **Feature Comparison Matrix** - Radar charts comparing key features across competitors
- **Narrative Gap Identification** - Pinpoints opportunities in competitor messaging
- **AI-Generated Content** - CEO video scripts and LinkedIn posts tailored to your positioning
- **Downloadable Dossier** - Export complete analysis as structured report

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Vite
- **Backend**: Express, TypeScript
- **AI Engine**: Google Gemini API (gemini-3-flash-preview)
- **Visualization**: Recharts
- **Animation**: Motion (Framer Motion)
- **Deployment**: Google AI Studio, Cloud Run

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd EdgeElevate-Hackathon-project-
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

4. Add your Gemini API key to `.env`:
   ```
   GEMINI_API_KEY="your-api-key-here"
   APP_URL="http://localhost:3000"
   ```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Build for Production

```bash
npm run build
npm run preview
```

## How to Use

1. Enter your startup/brand name in the input field
2. Click "Run Analysis" or select a preset (LINEAR, FIGMA, STRIPE, etc.)
3. Watch the 4-step analysis progress
4. Review the complete dashboard with:
   - Competitor positioning maps
   - Sentiment analysis charts
   - Strategic narrative insights
   - Generated content (video script + LinkedIn posts)
5. Download the full dossier for your records

## Project Structure

```
src/
├── main.tsx              # React entry point
├── App.tsx               # Main app orchestration (3-state flow)
├── index.css             # Global styles
├── components/
│   ├── AnalysisFlow.tsx  # Progress tracker UI
│   ├── Dashboard.tsx     # Results visualization
│   └── Charts.tsx        # Data visualization components
└── lib/
    └── utils.ts          # Utility functions

server.ts                 # Express backend (API orchestration)
notebooks/                # Jupyter notebooks for testing
```

## API Reference

### POST /api/analyze

Runs the complete 4-step analysis pipeline.

**Request:**
```json
{
  "startup": "YourStartupName"
}
```

**Response:**
```json
{
  "research": { /* competitor data */ },
  "sentiment": { /* review analysis */ },
  "insights": { /* strategic narrative */ },
  "content": { /* generated content */ }
}
```

## Development

```bash
npm run dev          # Run development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Type check with TypeScript
npm run clean        # Remove build artifacts
```

## Deployment

This app is designed to deploy on Google AI Studio with Cloud Run:

1. Push code to repository
2. Configure `GEMINI_API_KEY` and `APP_URL` in AI Studio Secrets
3. AI Studio automatically builds and deploys to Cloud Run

View live app: https://ai.studio/apps/a4efada3-24c6-42bf-b619-8428be754603

## Architecture

```
User Input (Startup Name)
        ↓
    Frontend (React)
        ↓
    POST /api/analyze
        ↓
    Express Server
        ↓
    Gemini API (4 Sequential Calls)
    ├─ Research → Competitor Data
    ├─ Sentiment → Review Analysis
    ├─ Insights → Strategic Narrative
    └─ Content → Video Script + Posts
        ↓
    Dashboard Visualization
```

## Contributing

This is a hackathon project. Contributions, issues, and feature requests are welcome.

## License

MIT

## Acknowledgments

- Built with Google Gemini API
- Deployed on Google AI Studio
- Inspired by competitive intelligence frameworks
