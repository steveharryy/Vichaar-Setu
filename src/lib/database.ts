// Database API wrapper - calls your Vercel API connected to Neon PostgreSQL

const API_URL = import.meta.env.VITE_API_URL || '';

export async function dbQuery<T = unknown>(action: string, data: Record<string, unknown> = {}): Promise<T[]> {
  if (!API_URL) {
    console.warn('VITE_API_URL not set - using mock data');
    return [] as T[];
  }

  const response = await fetch(`${API_URL}/api/db`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, data }),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    console.error('Database query error:', result.error);
    throw new Error(result.error || 'Database query failed');
  }

  return result.data as T[];
}

// ========== User Functions ==========
export interface DbUser {
  id: string;
  clerk_id: string;
  email: string;
  full_name: string | null;
  role: "student" | "investor" | null;
  avatar_url: string | null;
  bio: string | null;
  university: string | null;
  linkedin_url: string | null;
  website: string | null;
  created_at: string;
  updated_at: string;
}

export async function createOrUpdateUser(userData: {
  clerk_id: string;
  email: string;
  full_name?: string;
  role: "student" | "investor";
  avatar_url?: string;
}): Promise<DbUser> {
  const users = await dbQuery<DbUser>("createUser", userData);
  return users[0];
}

export async function getUser(clerk_id: string): Promise<DbUser | null> {
  const users = await dbQuery<DbUser>("getUser", { clerk_id });
  return users[0] || null;
}

export async function getUserRole(clerk_id: string): Promise<"student" | "investor" | null> {
  const result = await dbQuery<{ role: string }>("getUserRole", { clerk_id });
  return (result[0]?.role as "student" | "investor") || null;
}

export async function updateUserProfile(clerk_id: string, profile: Partial<DbUser>): Promise<DbUser> {
  const users = await dbQuery<DbUser>("updateUserProfile", { clerk_id, ...profile });
  return users[0];
}

// ========== Project Functions ==========
export interface DbProject {
  id: string;
  owner_clerk_id: string;
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
  created_at: string;
  updated_at: string;
}

export async function createProject(projectData: {
  clerk_id: string;
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
}): Promise<DbProject> {
  const projects = await dbQuery<DbProject>("createProject", projectData);
  return projects[0];
}

export async function getProjectsByOwner(clerk_id: string): Promise<DbProject[]> {
  return dbQuery<DbProject>("getProjectsByOwner", { clerk_id });
}

export async function getAllPublishedProjects(): Promise<DbProject[]> {
  return dbQuery<DbProject>("getAllPublishedProjects", {});
}

export async function getProjectById(project_id: string): Promise<DbProject | null> {
  const projects = await dbQuery<DbProject>("getProjectById", { project_id });
  return projects[0] || null;
}

export async function updateProject(project_id: string, updates: Partial<DbProject>): Promise<DbProject> {
  const projects = await dbQuery<DbProject>("updateProject", { project_id, ...updates });
  return projects[0];
}

export async function deleteProject(project_id: string, clerk_id: string): Promise<boolean> {
  const result = await dbQuery<{ id: string }>("deleteProject", { project_id, clerk_id });
  return result.length > 0;
}

// ========== Contact Request Functions ==========
export interface DbContactRequest {
  id: string;
  from_clerk_id: string;
  to_clerk_id: string;
  project_id: string;
  message: string;
  status: string;
  created_at: string;
  from_user_name?: string;
  from_user_avatar?: string;
  from_user_email?: string;
  project_title?: string;
}

export async function sendContactRequest(requestData: {
  from_clerk_id: string;
  to_clerk_id: string;
  project_id: string;
  message: string;
}): Promise<DbContactRequest> {
  const requests = await dbQuery<DbContactRequest>("sendContactRequest", requestData);
  return requests[0];
}

export async function getContactRequestsForUser(clerk_id: string): Promise<DbContactRequest[]> {
  return dbQuery<DbContactRequest>("getContactRequestsForUser", { clerk_id });
}

export async function getSentContactRequests(clerk_id: string): Promise<DbContactRequest[]> {
  return dbQuery<DbContactRequest>("getSentContactRequests", { clerk_id });
}

export async function updateContactRequestStatus(
  request_id: string,
  status: "accepted" | "declined",
  clerk_id: string
): Promise<DbContactRequest> {
  const requests = await dbQuery<DbContactRequest>("updateContactRequestStatus", {
    request_id,
    status,
    clerk_id,
  });
  return requests[0];
}

// ========== Initialize Database ==========
export async function initDatabase(): Promise<void> {
  await dbQuery("initDatabase", {});
}
