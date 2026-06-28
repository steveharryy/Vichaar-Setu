export default async function handler(req: any, res: any) {
  // Add CORS headers for local development
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*'); // Or restrict to your frontend URL
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  const { prompt } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt is required and must be a string' });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.error("Missing Gemini API Key in backend environment variables.");
    return res.status(500).json({ error: 'Gemini API key is not configured on the server.' });
  }

  try {
    // Dynamic import to avoid issues in some serverless environments if not fully supported, 
    // but required import is fine since we add it to package.json
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const aiPrompt = `You are an expert startup and hackathon advisor for students. 
    The student says their interests/skills/needs are: "${prompt}".
    Generate exactly 3 brilliant, realistic, and highly impactful project ideas for them.
    Return the output strictly as a JSON array of objects.
    Each object must exactly match this JSON structure:
    {
      "title": "A catchy name",
      "tagline": "A short 1-sentence tagline",
      "description": "2-3 sentences describing the overarching vision",
      "problem": "What specific problem this solves",
      "solution": "How this project gracefully solves the problem",
      "tech_stack": ["React", "Node.js", "AI", "etc"],
      "category": "SaaS" (or AI & ML, Developer Tools, Fintech, Health & Wellness, E-commerce, Productivity, Education)
    }
    Do not include any markdown formatting, backticks, or other text outside of the pure JSON array. Just the raw JSON.`;

    const result = await model.generateContent(aiPrompt);
    const response = await result.response;
    let text = response.text().trim();
    
    // Clean up potential markdown blocks
    text = text.replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();
    
    const parsedIdeas = JSON.parse(text);

    return res.status(200).json({ ideas: parsedIdeas });
  } catch (error: any) {
    console.error("AI Generation failed:", error);
    return res.status(500).json({ error: error.message || 'Failed to generate ideas.' });
  }
}
