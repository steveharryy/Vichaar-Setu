// backend/api/predict-success.ts
import { Request, Response } from 'express';

export default async function predictSuccessHandler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { title, description, tech_stack, funding_goal } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Missing title or description' });
    }

    console.log(`Forwarding Success Prediction request to Python engine for: ${title}`);

    // Call the fastAPI microservice running on port 8000
    const pythonEngineUrl = process.env.PYTHON_ENGINE_URL || 'http://127.0.0.1:8000/api/predict-success';
    
    const response = await fetch(pythonEngineUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        description,
        tech_stack: tech_stack || [],
        funding_goal: Number(funding_goal) || 0
      }),
    });
    
    if (!response.ok) {
        let errText = await response.text();
        console.error("Python engine error response:", errText);
        throw new Error(`Python engine returned ${response.status}: ${errText}`);
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error: any) {
    console.error('Error predicting success:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
