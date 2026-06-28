import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req: any, res: any) {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  // Set CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  try {
    const { action, data } = req.body;
    console.log(`Database action: ${action}`, data);

    let result;

    switch (action) {
      // ========== User Management ==========
      case 'createUser': {
        const { clerk_id, email, full_name, role, avatar_url } = data;
        const { data: user, error } = await supabase
          .from('profiles_clerk')
          .upsert({
            clerk_id,
            email,
            full_name,
            role,
            avatar_url,
            updated_at: new Date().toISOString()
          }, { onConflict: 'clerk_id' })
          .select()
          .single();
        
        if (error) throw error;
        result = [user];
        break;
      }

      case 'getUser': {
        const { clerk_id } = data;
        const { data: users, error } = await supabase
          .from('profiles_clerk')
          .select('*')
          .eq('clerk_id', clerk_id);
        
        if (error) throw error;
        result = users;
        break;
      }

      case 'getUserRole': {
        const { clerk_id } = data;
        const { data: users, error } = await supabase
          .from('profiles_clerk')
          .select('role')
          .eq('clerk_id', clerk_id);
        
        if (error) throw error;
        result = users;
        break;
      }

      case 'updateUserProfile': {
        const { clerk_id, full_name, bio, university, linkedin_url, website, avatar_url } = data;
        const { data: user, error } = await supabase
          .from('profiles_clerk')
          .update({
            full_name,
            bio,
            university,
            linkedin_url,
            website,
            avatar_url,
            updated_at: new Date().toISOString()
          } as any)
          .eq('clerk_id', clerk_id)
          .select()
          .single();
        
        if (error) throw error;
        result = [user];
        break;
      }

      // ========== Projects ==========
      case 'createProject': {
        const { 
          clerk_id, title, tagline, description, problem, solution, 
          tech_stack, category, demo_url, github_url, funding_goal, 
          founder_name, founder_avatar, founder_university, status 
        } = data;
        
        const { data: project, error } = await supabase
          .from('projects')
          .insert({
            clerk_user_id: clerk_id,
            title,
            tagline,
            description,
            problem,
            solution,
            tech_stack,
            category,
            demo_url,
            github_url,
            funding_goal,
            founder_name,
            founder_avatar,
            founder_university,
            status: status || 'draft'
          } as any)
          .select()
          .single();
        
        if (error) throw error;
        result = [project];
        break;
      }

      case 'getProjectsByOwner': {
        const { clerk_id } = data;
        const { data: projects, error } = await supabase
          .from('projects')
          .select('*')
          .eq('clerk_user_id', clerk_id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        result = projects;
        break;
      }

      case 'getAllPublishedProjects': {
        const { data: projects, error } = await supabase
          .from('projects')
          .select('*')
          .eq('status', 'published')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        result = projects;
        break;
      }

      case 'getProjectById': {
        const { project_id } = data;
        const { data: projects, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', project_id);
        
        if (error) throw error;
        result = projects;
        break;
      }

      case 'updateProject': {
        const { 
          project_id, title, tagline, description, problem, solution,
          tech_stack, category, demo_url, github_url, funding_goal, status
        } = data;
        
        const { data: project, error } = await supabase
          .from('projects')
          .update({
            title,
            tagline,
            description,
            problem,
            solution,
            tech_stack,
            category,
            demo_url,
            github_url,
            funding_goal,
            status,
            updated_at: new Date().toISOString()
          } as any)
          .eq('id', project_id)
          .select()
          .single();
        
        if (error) throw error;
        result = [project];
        break;
      }

      case 'deleteProject': {
        const { project_id, clerk_id } = data;
        const { data: deleted, error } = await supabase
          .from('projects')
          .delete()
          .eq('id', project_id)
          .eq('clerk_user_id', clerk_id)
          .select('id');
        
        if (error) throw error;
        result = deleted;
        break;
      }

      // ========== Contact Requests ==========
      case 'sendContactRequest': {
        const { from_clerk_id, to_clerk_id, project_id, message } = data;
        const { data: request, error } = await supabase
          .from('contact_requests')
          .insert({
            from_clerk_id,
            to_clerk_id,
            project_id,
            message,
            status: 'pending'
          } as any)
          .select()
          .single();
        
        if (error) throw error;
        result = [request];
        break;
      }

      case 'getContactRequestsForUser': {
        const { clerk_id } = data;
        const { data: requests, error } = await supabase
          .from('contact_requests')
          .select(`
            *,
            profiles_clerk!contact_requests_from_clerk_id_fkey (
              full_name,
              avatar_url,
              email
            ),
            projects:project_id (
              title
            )
          ` as any)
          .eq('to_clerk_id', clerk_id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Transform result to match existing API expectations
        result = (requests || []).map((req: any) => ({
          ...req,
          from_user_name: req.profiles_clerk?.full_name,
          from_user_avatar: req.profiles_clerk?.avatar_url,
          from_user_email: req.profiles_clerk?.email,
          project_title: req.projects?.title
        }));
        break;
      }

      case 'getSentContactRequests': {
        const { clerk_id } = data;
        const { data: requests, error } = await supabase
          .from('contact_requests')
          .select(`
            *,
            projects:project_id (
              title
            )
          ` as any)
          .eq('from_clerk_id', clerk_id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Transform result to match existing API expectations
        result = (requests || []).map((req: any) => ({
          ...req,
          project_title: req.projects?.title
        }));
        break;
      }

      case 'updateContactRequestStatus': {
        const { request_id, status, clerk_id } = data;
        const { data: request, error } = await supabase
          .from('contact_requests')
          .update({ status })
          .eq('id', request_id)
          .eq('to_clerk_id', clerk_id)
          .select()
          .single();
        
        if (error) throw error;
        result = [request];
        break;
      }

      // ========== Investor Preferences ==========
      case 'saveInvestorPreferences': {
        const { investor_clerk_id, preferred_categories, min_funding, max_funding, preferred_tech_stack, investment_thesis } = data;
        const { data: pref, error } = await supabase
          .from('investor_preferences')
          .upsert({
            investor_clerk_id,
            preferred_categories: preferred_categories || [],
            min_funding: min_funding || 0,
            max_funding: max_funding || 1000000,
            preferred_tech_stack: preferred_tech_stack || [],
            investment_thesis: investment_thesis || '',
          } as any, { onConflict: 'investor_clerk_id' })
          .select()
          .single();
        
        if (error) throw error;
        result = [pref];
        break;
      }

      case 'getInvestorPreferences': {
        const { investor_clerk_id } = data;
        const { data: prefs, error } = await supabase
          .from('investor_preferences')
          .select('*')
          .eq('investor_clerk_id', investor_clerk_id);
        
        if (error) throw error;
        result = prefs;
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return res.status(200).json({ success: true, data: result });

  } catch (error: any) {
    console.error('Database error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
