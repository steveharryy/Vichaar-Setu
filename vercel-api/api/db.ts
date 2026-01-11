// Vercel Serverless Function - Deploy this to Vercel separately
// npm install @neondatabase/serverless

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

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
        result = await sql`
          INSERT INTO users (clerk_id, email, full_name, role, avatar_url, created_at, updated_at)
          VALUES (${clerk_id}, ${email}, ${full_name}, ${role}, ${avatar_url}, NOW(), NOW())
          ON CONFLICT (clerk_id) DO UPDATE SET
            email = EXCLUDED.email,
            full_name = EXCLUDED.full_name,
            role = EXCLUDED.role,
            avatar_url = EXCLUDED.avatar_url,
            updated_at = NOW()
          RETURNING *
        `;
        break;
      }

      case 'getUser': {
        const { clerk_id } = data;
        result = await sql`SELECT * FROM users WHERE clerk_id = ${clerk_id}`;
        break;
      }

      case 'getUserRole': {
        const { clerk_id } = data;
        result = await sql`SELECT role FROM users WHERE clerk_id = ${clerk_id}`;
        break;
      }

      case 'updateUserProfile': {
        const { clerk_id, full_name, bio, university, linkedin_url, website, avatar_url } = data;
        result = await sql`
          UPDATE users SET
            full_name = COALESCE(${full_name}, full_name),
            bio = COALESCE(${bio}, bio),
            university = COALESCE(${university}, university),
            linkedin_url = COALESCE(${linkedin_url}, linkedin_url),
            website = COALESCE(${website}, website),
            avatar_url = COALESCE(${avatar_url}, avatar_url),
            updated_at = NOW()
          WHERE clerk_id = ${clerk_id}
          RETURNING *
        `;
        break;
      }

      // ========== Projects ==========
      case 'createProject': {
        const { 
          clerk_id, title, tagline, description, problem, solution, 
          tech_stack, category, demo_url, github_url, funding_goal, 
          founder_name, founder_avatar, founder_university, status 
        } = data;
        
        result = await sql`
          INSERT INTO projects (
            owner_clerk_id, title, tagline, description, problem, solution,
            tech_stack, category, demo_url, github_url, funding_goal,
            founder_name, founder_avatar, founder_university, status, created_at, updated_at
          )
          VALUES (
            ${clerk_id}, ${title}, ${tagline}, ${description}, ${problem}, ${solution},
            ${tech_stack}, ${category}, ${demo_url}, ${github_url}, ${funding_goal},
            ${founder_name}, ${founder_avatar}, ${founder_university}, ${status || 'draft'}, NOW(), NOW()
          )
          RETURNING *
        `;
        break;
      }

      case 'getProjectsByOwner': {
        const { clerk_id } = data;
        result = await sql`
          SELECT * FROM projects WHERE owner_clerk_id = ${clerk_id} ORDER BY created_at DESC
        `;
        break;
      }

      case 'getAllPublishedProjects': {
        result = await sql`
          SELECT * FROM projects WHERE status = 'published' ORDER BY created_at DESC
        `;
        break;
      }

      case 'getProjectById': {
        const { project_id } = data;
        result = await sql`SELECT * FROM projects WHERE id = ${project_id}`;
        break;
      }

      case 'updateProject': {
        const { 
          project_id, title, tagline, description, problem, solution,
          tech_stack, category, demo_url, github_url, funding_goal, status
        } = data;
        
        result = await sql`
          UPDATE projects SET
            title = COALESCE(${title}, title),
            tagline = COALESCE(${tagline}, tagline),
            description = COALESCE(${description}, description),
            problem = COALESCE(${problem}, problem),
            solution = COALESCE(${solution}, solution),
            tech_stack = COALESCE(${tech_stack}, tech_stack),
            category = COALESCE(${category}, category),
            demo_url = COALESCE(${demo_url}, demo_url),
            github_url = COALESCE(${github_url}, github_url),
            funding_goal = COALESCE(${funding_goal}, funding_goal),
            status = COALESCE(${status}, status),
            updated_at = NOW()
          WHERE id = ${project_id}
          RETURNING *
        `;
        break;
      }

      case 'deleteProject': {
        const { project_id, clerk_id } = data;
        result = await sql`
          DELETE FROM projects WHERE id = ${project_id} AND owner_clerk_id = ${clerk_id}
          RETURNING id
        `;
        break;
      }

      // ========== Contact Requests ==========
      case 'sendContactRequest': {
        const { from_clerk_id, to_clerk_id, project_id, message } = data;
        result = await sql`
          INSERT INTO contact_requests (from_clerk_id, to_clerk_id, project_id, message, status, created_at)
          VALUES (${from_clerk_id}, ${to_clerk_id}, ${project_id}, ${message}, 'pending', NOW())
          RETURNING *
        `;
        break;
      }

      case 'getContactRequestsForUser': {
        const { clerk_id } = data;
        result = await sql`
          SELECT cr.*, 
            u.full_name as from_user_name, 
            u.avatar_url as from_user_avatar,
            u.email as from_user_email,
            p.title as project_title
          FROM contact_requests cr
          LEFT JOIN users u ON cr.from_clerk_id = u.clerk_id
          LEFT JOIN projects p ON cr.project_id = p.id
          WHERE cr.to_clerk_id = ${clerk_id}
          ORDER BY cr.created_at DESC
        `;
        break;
      }

      case 'getSentContactRequests': {
        const { clerk_id } = data;
        result = await sql`
          SELECT cr.*, p.title as project_title
          FROM contact_requests cr
          LEFT JOIN projects p ON cr.project_id = p.id
          WHERE cr.from_clerk_id = ${clerk_id}
          ORDER BY cr.created_at DESC
        `;
        break;
      }

      case 'updateContactRequestStatus': {
        const { request_id, status, clerk_id } = data;
        result = await sql`
          UPDATE contact_requests SET status = ${status}
          WHERE id = ${request_id} AND to_clerk_id = ${clerk_id}
          RETURNING *
        `;
        break;
      }

      // ========== Initialize Database ==========
      case 'initDatabase': {
        await sql`
          CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            clerk_id TEXT UNIQUE NOT NULL,
            email TEXT NOT NULL,
            full_name TEXT,
            role TEXT CHECK (role IN ('student', 'investor')),
            avatar_url TEXT,
            bio TEXT,
            university TEXT,
            linkedin_url TEXT,
            website TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          )
        `;

        await sql`
          CREATE TABLE IF NOT EXISTS projects (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            owner_clerk_id TEXT NOT NULL,
            title TEXT NOT NULL,
            tagline TEXT,
            description TEXT,
            problem TEXT,
            solution TEXT,
            tech_stack TEXT[],
            category TEXT,
            demo_url TEXT,
            github_url TEXT,
            funding_goal NUMERIC,
            founder_name TEXT,
            founder_avatar TEXT,
            founder_university TEXT,
            logo_url TEXT,
            status TEXT DEFAULT 'draft',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          )
        `;

        await sql`
          CREATE TABLE IF NOT EXISTS contact_requests (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            from_clerk_id TEXT NOT NULL,
            to_clerk_id TEXT NOT NULL,
            project_id UUID,
            message TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMPTZ DEFAULT NOW()
          )
        `;

        result = [{ success: true, message: 'Database initialized' }];
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
