import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Gemini API client (Lazy initialization not strictly required here as it's used in routes)
  // But we'll follow the pattern for safety
  const getAI = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    return new GoogleGenAI({ apiKey });
  };

  // API Routes
  app.post("/api/analyze", async (req, res) => {
    const { startupName } = req.body;
    if (!startupName) {
      return res.status(400).json({ error: "Startup name is required" });
    }

    try {
      const ai = getAI();
      const model = "gemini-3-flash-preview";

      // Step 1: Research & Competitor identification
      const researchPrompt = `
        You are a market analyst at Peec AI. 
        Analyze the startup: "${startupName}".
        1. Identify top 3 primary competitors.
        2. For each, extract positioning, messaging, strengths, and weaknesses.
        3. Identify narrative gaps between "${startupName}" and these competitors.
        Return as JSON matching a structured format.
      `;

      const researchResponse = await ai.models.generateContent({
        model,
        contents: researchPrompt,
        config: { responseMimeType: "application/json" }
      });
      const researchData = JSON.parse(researchResponse.text || "{}");

      // Step 2: Sentiment Simulation (since we don't have real scrapers, we use AI to simulate common sentiment)
      const sentimentPrompt = `
        You are simulating sentiment analysis from Trustpilot and G2 for "${startupName}" and its competitors.
        Competitors: ${researchData.competitors?.map((c: any) => c.name).join(", ")}.
        Generate:
        1. Common complaints (pain points) for each.
        2. Positive highlights.
        3. Sentiment trends (scores out of 100).
        4. Key feature comparisons.
        Return as JSON.
      `;
      const sentimentResponse = await ai.models.generateContent({
        model,
        contents: sentimentPrompt,
        config: { responseMimeType: "application/json" }
      });
      const sentimentData = JSON.parse(sentimentResponse.text || "{}");

      // Step 3: Insight Structuring (Q-Context)
      const insightsPrompt = `
        Based on these datasets:
        Research: ${JSON.stringify(researchData)}
        Sentiment: ${JSON.stringify(sentimentData)}
        
        Generate a refined positioning narrative (Q-Context):
        1. Core Value Proposition.
        2. Differentiation Angle.
        3. Target Audience Alignment.
        4. A final Positioning Statement.
        5. Detailed report sections (Overview, Landscape, SWOT, Opportunity Map).
        Return as JSON.
      `;
      const insightsResponse = await ai.models.generateContent({
        model,
        contents: insightsPrompt,
        config: { responseMimeType: "application/json" }
      });
      const insightData = JSON.parse(insightsResponse.text || "{}");

      // Step 4: Content Generation (HERA & LinkedIn)
      const contentPrompt = `
        Based on the positioning: ${insightData.positioningStatement}
        Create:
        1. A high-impact Video Script (CEO-level narrative).
        2. 3 LinkedIn posts:
           - Post 1: Insight-driven (market gap).
           - Post 2: Founder narrative (vision).
           - Post 3: Product-led (features vs competitors).
        Return as JSON.
      `;
      const contentResponse = await ai.models.generateContent({
        model,
        contents: contentPrompt,
        config: { responseMimeType: "application/json" }
      });
      const contentData = JSON.parse(contentResponse.text || "{}");

      res.json({
        startupName,
        research: researchData,
        sentiment: sentimentData,
        insights: insightData,
        content: contentData,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error("Analysis failed:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
