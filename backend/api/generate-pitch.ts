// backend/api/generate-pitch.ts
import { Request, Response } from 'express';

export default async function generatePitchHandler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { title, description, tech_stack } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Missing title or description' });
    }

    console.log(`Forwarding AI Copilot request to Python engine for: ${title}`);

    // Call the fastAPI microservice running on port 8000
    const pythonEngineUrl = process.env.PYTHON_ENGINE_URL || 'http://127.0.0.1:8000/api/copilot';
    
    // Set a high timeout because Langchain generation can take up to 20 seconds
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout
    
    const response = await fetch(pythonEngineUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        description,
        tech_stack: tech_stack || [],
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
        let errText = await response.text();
        console.error("Python engine error response:", errText);
        throw new Error(`Python engine returned ${response.status}: ${errText}`);
    }

    const data = await response.json();
    
    // Return the generated markdown, diagram, and logo back to the frontend
    return res.status(200).json(data);

  } catch (error: any) {
    if (error.name === 'AbortError') {
       return res.status(504).json({ error: 'AI processing took too long and timed out.' });
    }
    console.error('Error generating AI pitch:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
