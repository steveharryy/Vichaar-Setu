// backend/api/investor-match.ts
import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function investorMatchHandler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { project_id } = req.body;

    if (!project_id) {
      return res.status(400).json({ error: 'Missing project_id' });
    }

    console.log(`Fetching investor matches for project: ${project_id}`);

    // 1. Fetch project details from PostgreSQL
    const { data: project, error: projErr } = await supabase
      .from('projects')
      .select('id, title, description, tagline, category, tech_stack, funding_goal')
      .eq('id', project_id)
      .single();

    if (projErr || !project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // 2. Fetch all investor preferences
    const { data: preferences, error: prefErr } = await supabase
      .from('investor_preferences')
      .select('*');

    if (prefErr) {
      console.error('Error fetching investor preferences:', prefErr);
      return res.status(500).json({ error: 'Failed to fetch investor preferences' });
    }

    // 3. Enrich preferences with investor profile data
    const enrichedInvestors = [];
    for (const pref of (preferences || [])) {
      const { data: profile } = await supabase
        .from('profiles_clerk')
        .select('full_name, avatar_url, email, university')
        .eq('clerk_id', pref.investor_clerk_id)
        .single();

      enrichedInvestors.push({
        investor_clerk_id: pref.investor_clerk_id,
        full_name: profile?.full_name || 'Anonymous Investor',
        avatar_url: profile?.avatar_url || null,
        email: profile?.email || null,
        university: profile?.university || null,
        preferred_categories: pref.preferred_categories || [],
        min_funding: pref.min_funding || 0,
        max_funding: pref.max_funding || 1000000,
        preferred_tech_stack: pref.preferred_tech_stack || [],
        investment_thesis: pref.investment_thesis || 'General early-stage tech investments',
      });
    }

    // 4. Forward to Python AI engine for semantic matching
    const pythonEngineUrl = process.env.PYTHON_ENGINE_URL || 'http://127.0.0.1:8000/api/investor-match';
    const engineEndpoint = pythonEngineUrl.endsWith('/api/investor-match') 
      ? pythonEngineUrl 
      : `${pythonEngineUrl}/api/investor-match`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    const response = await fetch(engineEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_title: project.title,
        project_description: project.description || project.tagline || '',
        category: project.category || 'General',
        tech_stack: Array.isArray(project.tech_stack) ? project.tech_stack : [],
        funding_goal: Number(project.funding_goal) || 0,
        investors: enrichedInvestors,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errText = await response.text();
      console.error('Python engine error response:', errText);
      throw new Error(`Python engine returned ${response.status}: ${errText}`);
    }

    const matchData = await response.json();
    return res.status(200).json(matchData);

  } catch (error: any) {
    if (error.name === 'AbortError') {
      return res.status(504).json({ error: 'AI matching took too long and timed out.' });
    }
    console.error('Error in investor-match handler:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
