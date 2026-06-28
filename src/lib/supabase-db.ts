// Supabase database helpers for Lovable Cloud / Local Fallback
// Uses the clerk_user_id column to link records to Clerk users
// Gracefully falls back to localStorage mock database when Supabase is not configured or offline.

import { supabase } from "@/integrations/supabase/client";
import { startups } from "@/data/mockData";

// Helper to ensure Supabase is available
const requireSupabase = () => {
  if (!supabase) {
    throw new Error('Database not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to your environment.');
  }
  return supabase;
};

// ========== Types ==========
export interface Project {
  id: string;
  owner_id: string;
  clerk_user_id: string | null;
  title: string;
  tagline: string | null;
  description: string | null;
  problem: string | null;
  solution: string | null;
  tech_stack: string[] | null;
  category: string | null;
  demo_url: string | null;
  github_url: string | null;
  funding_goal: number | null;
  founder_name: string | null;
  founder_avatar: string | null;
  founder_university: string | null;
  logo_url: string | null;
  status: string | null;
  upvotes: number | null;
  created_at: string;
  updated_at: string;
}

export interface ContactRequest {
  id: string;
  from_user_id: string;
  to_user_id: string;
  from_clerk_id: string | null;
  to_clerk_id: string | null;
  project_id: string;
  message: string;
  status: string | null;
  created_at: string;
  // Joined fields
  from_user_name?: string;
  from_user_avatar?: string;
  from_user_email?: string;
  project_title?: string;
}

export interface ClerkUserProfile {
  id: string;
  clerk_id: string;
  email: string;
  full_name: string | null;
  role: 'student' | 'investor' | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

// ========== Local Fallback Helpers ==========
const mapStartupToProject = (s: any): Project => ({
  id: s.id,
  owner_id: s.founder.id,
  clerk_user_id: s.founder.id,
  title: s.name,
  tagline: s.tagline,
  description: s.description,
  problem: s.problem,
  solution: s.solution,
  tech_stack: s.techStack,
  category: s.category,
  demo_url: s.website || null,
  github_url: s.github || null,
  funding_goal: 50000,
  founder_name: s.founder.name,
  founder_avatar: s.founder.avatar,
  founder_university: "BITS Pilani",
  logo_url: s.logo,
  status: "published",
  upvotes: s.upvotes,
  created_at: s.createdAt + "T00:00:00Z",
  updated_at: s.createdAt + "T00:00:00Z"
});

const getLocalProjects = (): Project[] => {
  const local = localStorage.getItem("vs_local_projects");
  if (local) {
    return JSON.parse(local);
  }
  const initial = startups.map(mapStartupToProject);
  localStorage.setItem("vs_local_projects", JSON.stringify(initial));
  return initial;
};

const saveLocalProjects = (projects: Project[]) => {
  localStorage.setItem("vs_local_projects", JSON.stringify(projects));
};

// ========== User Functions ==========

export async function syncClerkUserToSupabase(data: {
  clerkId: string;
  email: string;
  fullName?: string;
  role: 'student' | 'investor';
  avatarUrl?: string;
}): Promise<ClerkUserProfile> {
  try {
    const { data: profile, error } = await (requireSupabase() as any)
      .from('profiles_clerk')
      .upsert({
        clerk_id: data.clerkId,
        email: data.email,
        full_name: data.fullName || null,
        role: data.role,
        avatar_url: data.avatarUrl || null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'clerk_id'
      })
      .select()
      .single();

    if (error) throw error;
    return profile as ClerkUserProfile;
  } catch (e) {
    console.warn("Supabase syncClerkUserToSupabase failed, returning mock profile:", e);
    return {
      id: data.clerkId,
      clerk_id: data.clerkId,
      email: data.email,
      full_name: data.fullName || null,
      role: data.role,
      avatar_url: data.avatarUrl || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
}

// ========== Project Functions ==========

export async function createProject(data: {
  clerkUserId: string;
  title: string;
  tagline?: string;
  description?: string;
  problem?: string;
  solution?: string;
  tech_stack?: string[];
  category?: string;
  demo_url?: string;
  github_url?: string;
  funding_goal?: number;
  founder_name?: string;
  founder_avatar?: string;
  founder_university?: string;
  status?: string;
}): Promise<Project> {
  try {
    const { data: project, error } = await requireSupabase()
      .from('projects')
      .insert({
        clerk_user_id: data.clerkUserId,
        title: data.title,
        tagline: data.tagline || null,
        description: data.description || null,
        problem: data.problem || null,
        solution: data.solution || null,
        tech_stack: data.tech_stack || null,
        category: data.category || null,
        demo_url: data.demo_url || null,
        github_url: data.github_url || null,
        funding_goal: data.funding_goal || null,
        founder_name: data.founder_name || null,
        founder_avatar: data.founder_avatar || null,
        founder_university: data.founder_university || null,
        status: data.status || 'published',
      } as any)
      .select()
      .single();

    if (error) throw error;
    return project as Project;
  } catch (e) {
    console.warn("Supabase createProject failed, saving in localStorage:", e);
    const newProject: Project = {
      id: `project_${Math.random().toString(36).substr(2, 9)}`,
      owner_id: data.clerkUserId,
      clerk_user_id: data.clerkUserId,
      title: data.title,
      tagline: data.tagline || null,
      description: data.description || null,
      problem: data.problem || null,
      solution: data.solution || null,
      tech_stack: data.tech_stack || null,
      category: data.category || null,
      demo_url: data.demo_url || null,
      github_url: data.github_url || null,
      funding_goal: data.funding_goal || null,
      founder_name: data.founder_name || "Jane Student",
      founder_avatar: data.founder_avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=student",
      founder_university: data.founder_university || "BITS Pilani",
      logo_url: data.founder_avatar || "https://api.dicebear.com/7.x/shapes/svg?seed=project",
      status: data.status || 'published',
      upvotes: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    const local = getLocalProjects();
    local.unshift(newProject);
    saveLocalProjects(local);
    return newProject;
  }
}

export async function getProjectsByClerkUser(clerkUserId: string): Promise<Project[]> {
  try {
    const { data, error } = await requireSupabase()
      .from('projects')
      .select('*')
      .eq('clerk_user_id', clerkUserId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as Project[];
  } catch (e) {
    console.warn("Supabase getProjectsByClerkUser failed, reading from localStorage:", e);
    return getLocalProjects().filter(p => p.clerk_user_id === clerkUserId);
  }
}

export async function getAllPublishedProjects(): Promise<Project[]> {
  try {
    const { data, error } = await requireSupabase()
      .from('projects')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as Project[];
  } catch (e) {
    console.warn("Supabase getAllPublishedProjects failed, reading from localStorage:", e);
    return getLocalProjects().filter(p => p.status === 'published');
  }
}

export async function getProjectById(projectId: string): Promise<Project | null> {
  try {
    const { data, error } = await requireSupabase()
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data as Project;
  } catch (e) {
    console.warn("Supabase getProjectById failed, reading from localStorage:", e);
    return getLocalProjects().find(p => p.id === projectId) || null;
  }
}

export async function updateProject(
  projectId: string,
  clerkUserId: string,
  updates: Partial<Omit<Project, 'id' | 'owner_id' | 'clerk_user_id' | 'created_at'>>
): Promise<Project> {
  try {
    const { data, error } = await requireSupabase()
      .from('projects')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId)
      .eq('clerk_user_id', clerkUserId) // Ensure user owns the project
      .select()
      .single();

    if (error) throw error;
    return data as Project;
  } catch (e) {
    console.warn("Supabase updateProject failed, updating in localStorage:", e);
    const local = getLocalProjects();
    const idx = local.findIndex(p => p.id === projectId && p.clerk_user_id === clerkUserId);
    if (idx === -1) throw new Error("Project not found in localStorage");
    const updated = {
      ...local[idx],
      ...updates,
      updated_at: new Date().toISOString()
    } as Project;
    local[idx] = updated;
    saveLocalProjects(local);
    return updated;
  }
}

export async function deleteProject(projectId: string, clerkUserId: string): Promise<boolean> {
  try {
    const { error } = await requireSupabase()
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('clerk_user_id', clerkUserId);

    if (error) throw error;
    return true;
  } catch (e) {
    console.warn("Supabase deleteProject failed, deleting from localStorage:", e);
    const local = getLocalProjects();
    const filtered = local.filter(p => !(p.id === projectId && p.clerk_user_id === clerkUserId));
    saveLocalProjects(filtered);
    return true;
  }
}

// ========== Contact Request Functions ==========

export async function getContactRequestsForClerkUser(clerkUserId: string): Promise<ContactRequest[]> {
  let supabaseRequests: ContactRequest[] = [];
  try {
    const { data, error } = await requireSupabase()
      .from('contact_requests')
      .select('*')
      .eq('to_clerk_id', clerkUserId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    supabaseRequests = (data || []) as ContactRequest[];
  } catch (e) {
    console.warn("Supabase getContactRequestsForClerkUser failed, reading from localStorage:", e);
  }

  try {
    const reqs = localStorage.getItem("vs_local_contact_requests") || "[]";
    const parsed = JSON.parse(reqs) as ContactRequest[];
    const localRequests = parsed.filter(r => r.to_clerk_id === clerkUserId);
    
    // Merge and deduplicate by request ID
    const combined = [...supabaseRequests, ...localRequests];
    const uniqueRequests = combined.filter(
      (value, index, self) => self.findIndex(t => t.id === value.id) === index
    );
    
    // Sort descending by created_at
    return uniqueRequests.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  } catch (localError) {
    console.error("Failed to parse localStorage contact requests:", localError);
    return supabaseRequests;
  }
}

export async function sendContactRequest(data: {
  fromClerkId: string;
  toClerkId: string;
  projectId: string;
  message: string;
}): Promise<ContactRequest> {
  try {
    const { data: request, error } = await requireSupabase()
      .from('contact_requests')
      .insert({
        from_clerk_id: data.fromClerkId,
        to_clerk_id: data.toClerkId,
        project_id: data.projectId,
        message: data.message,
        status: 'pending',
      } as any)
      .select()
      .single();

    if (error) throw error;
    return request as ContactRequest;
  } catch (e) {
    console.warn("Supabase sendContactRequest failed, saving in localStorage:", e);
    const project = getLocalProjects().find(p => p.id === data.projectId);
    const newRequest: ContactRequest = {
      id: `request_${Math.random().toString(36).substr(2, 9)}`,
      from_user_id: data.fromClerkId,
      to_user_id: data.toClerkId,
      from_clerk_id: data.fromClerkId,
      to_clerk_id: data.toClerkId,
      project_id: data.projectId,
      message: data.message,
      status: 'pending',
      created_at: new Date().toISOString(),
      from_user_name: 'Demo Investor',
      from_user_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demoinvestor',
      from_user_email: 'investor@example.com',
      project_title: project?.title || 'Demo Project'
    };
    const reqs = localStorage.getItem("vs_local_contact_requests") || "[]";
    const parsed = JSON.parse(reqs) as ContactRequest[];
    parsed.unshift(newRequest);
    localStorage.setItem("vs_local_contact_requests", JSON.stringify(parsed));
    return newRequest;
  }
}

export async function updateContactRequestStatus(
  requestId: string,
  clerkUserId: string,
  status: 'accepted' | 'declined'
): Promise<ContactRequest> {
  try {
    const { data, error } = await requireSupabase()
      .from('contact_requests')
      .update({ status })
      .eq('id', requestId)
      .eq('to_clerk_id', clerkUserId)
      .select()
      .single();

    if (error) throw error;
    return data as ContactRequest;
  } catch (e) {
    console.warn("Supabase updateContactRequestStatus failed, updating in localStorage:", e);
    const reqs = localStorage.getItem("vs_local_contact_requests") || "[]";
    const parsed = JSON.parse(reqs) as ContactRequest[];
    const idx = parsed.findIndex(r => r.id === requestId && r.to_clerk_id === clerkUserId);
    if (idx === -1) throw new Error("Contact request not found");
    parsed[idx].status = status;
    localStorage.setItem("vs_local_contact_requests", JSON.stringify(parsed));
    return parsed[idx];
  }
}

export async function getSentContactRequests(clerkUserId: string): Promise<ContactRequest[]> {
  try {
    const { data, error } = await requireSupabase()
      .from('contact_requests')
      .select('*')
      .eq('from_clerk_id', clerkUserId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as ContactRequest[];
  } catch (e) {
    console.warn("Supabase getSentContactRequests failed, reading from localStorage:", e);
    const reqs = localStorage.getItem("vs_local_contact_requests") || "[]";
    const parsed = JSON.parse(reqs) as ContactRequest[];
    return parsed.filter(r => r.from_clerk_id === clerkUserId);
  }
}

export async function upvoteProject(projectId: string, clerkUserId: string): Promise<number> {
  try {
    const { data, error } = await (requireSupabase() as any)
      .rpc('increment_upvotes', { p_id: projectId, u_clerk_id: clerkUserId });

    if (error) throw error;
    
    // Fetch the updated count
    const { data: projectData, error: fetchError } = await requireSupabase()
      .from('projects')
      .select('upvotes')
      .eq('id', projectId)
      .single();

    if (fetchError) {
      console.error('Error fetching updated upvotes:', fetchError);
      return 0;
    }

    return (projectData as any).upvotes || 0;
  } catch (e) {
    console.warn("Supabase upvoteProject failed, upvoting in localStorage:", e);
    const upvotes = localStorage.getItem("vs_local_upvotes") || "[]";
    const upvotedIds = JSON.parse(upvotes);
    if (!upvotedIds.includes(projectId)) {
      upvotedIds.push(projectId);
      localStorage.setItem("vs_local_upvotes", JSON.stringify(upvotedIds));
    }
    
    const local = getLocalProjects();
    const idx = local.findIndex(p => p.id === projectId);
    if (idx !== -1) {
      local[idx].upvotes = (local[idx].upvotes || 0) + 1;
      saveLocalProjects(local);
      return local[idx].upvotes || 0;
    }
    return 0;
  }
}

export async function getUserUpvotes(clerkUserId: string): Promise<string[]> {
  try {
    const { data, error } = await (requireSupabase() as any)
      .from('project_upvotes')
      .select('project_id')
      .eq('user_clerk_id', clerkUserId);

    if (error) {
      console.error('Error fetching user upvotes:', error);
      return [];
    }

    return (data || []).map(row => row.project_id);
  } catch (e) {
    console.warn("Supabase getUserUpvotes failed, reading from localStorage:", e);
    const upvotes = localStorage.getItem("vs_local_upvotes") || "[]";
    return JSON.parse(upvotes);
  }
}

// ========== Message Functions (Encrypted Chat) ==========

export interface Message {
  id: string;
  contact_request_id: string;
  sender_clerk_id: string;
  content: string; // Encrypted ciphertext in DB, decrypted on client
  created_at: string;
}

export async function getMessagesForThread(contactRequestId: string): Promise<Message[]> {
  try {
    const { data, error } = await (requireSupabase() as any)
      .from('messages')
      .select('*')
      .eq('contact_request_id', contactRequestId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data || []) as Message[];
  } catch (e) {
    console.warn("Supabase getMessagesForThread failed, reading from localStorage:", e);
    const msgs = localStorage.getItem("vs_local_messages") || "[]";
    const parsed = JSON.parse(msgs) as Message[];
    return parsed.filter(m => m.contact_request_id === contactRequestId);
  }
}

export async function sendMessage(data: {
  contactRequestId: string;
  senderClerkId: string;
  content: string; // Already encrypted by the caller
}): Promise<Message> {
  try {
    const { data: message, error } = await (requireSupabase() as any)
      .from('messages')
      .insert({
        contact_request_id: data.contactRequestId,
        sender_clerk_id: data.senderClerkId,
        content: data.content,
      })
      .select()
      .single();

    if (error) throw error;
    return message as Message;
  } catch (e) {
    console.warn("Supabase sendMessage failed, saving in localStorage:", e);
    const newMessage: Message = {
      id: `msg_${Math.random().toString(36).substr(2, 9)}`,
      contact_request_id: data.contactRequestId,
      sender_clerk_id: data.senderClerkId,
      content: data.content,
      created_at: new Date().toISOString(),
    };
    const msgs = localStorage.getItem("vs_local_messages") || "[]";
    const parsed = JSON.parse(msgs) as Message[];
    parsed.push(newMessage);
    localStorage.setItem("vs_local_messages", JSON.stringify(parsed));
    return newMessage;
  }
}

/**
 * Subscribe to realtime message updates for a thread.
 * Returns an unsubscribe function.
 */
export function subscribeToMessages(
  contactRequestId: string,
  onNewMessage: (message: Message) => void
): () => void {
  let channel: any = null;

  (async () => {
    try {
      const sb = requireSupabase() as any;
      channel = sb
        .channel(`messages:${contactRequestId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `contact_request_id=eq.${contactRequestId}`,
          },
          (payload: any) => {
            onNewMessage(payload.new as Message);
          }
        )
        .subscribe();
    } catch (e) {
      console.warn("Supabase realtime subscription failed:", e);
    }
  })();

  return () => {
    if (channel) {
      (async () => {
        try {
          const sb = requireSupabase() as any;
          sb.removeChannel(channel);
        } catch (e) {
          console.warn("Failed to remove channel:", e);
        }
      })();
    }
  };
}
