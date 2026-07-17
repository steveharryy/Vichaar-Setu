// backend/api/rag.ts
import { Request, Response } from 'express';

const pythonBaseUrl = process.env.PYTHON_ENGINE_URL || 'http://127.0.0.1:8000';

/**
 * Express router mapping for the Smart Deal Flow RAG pipeline.
 * Proxies calls directly to the Python AI engine microservice.
 */
export default async function ragHandler(req: Request, res: Response) {
  const { path } = req;
  const method = req.method;

  try {
    // Construct the corresponding URL for Python AI Engine
    // e.g. req.originalUrl is '/api/rag/search' -> map to 'http://127.0.0.1:8000/api/rag/search'
    const targetUrl = `${pythonBaseUrl}${req.originalUrl}`;

    console.log(`[RAG Proxy] Forwarding ${method} request to Python engine: ${targetUrl}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 second timeout for complex generation

    const fetchOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    };

    if (method === 'POST' || method === 'PUT') {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, fetchOptions);
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[RAG Proxy Error] Python engine returned status ${response.status}:`, errText);
      return res.status(response.status).json({
        error: `Python AI engine error: ${errText || response.statusText}`,
      });
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error('[RAG Proxy Timeout] RAG pipeline request timed out.');
      return res.status(504).json({ error: 'AI retrieval or processing timed out.' });
    }
    console.error('[RAG Proxy Exception] Error during RAG proxying:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
