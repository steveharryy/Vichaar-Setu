import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { useAuth } from '@/contexts/AuthContext';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import ChatPanel from '@/components/chat/ChatPanel';
import InvestorMatchPanel from '@/components/investor/InvestorMatchPanel';
import InvestorPreferencesDialog from '@/components/investor/InvestorPreferencesDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SmartSearch from '@/components/investor/SmartSearch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  TrendingUp, LogOut, Search, Rocket, MessageSquare, MessageCircle,
  Github, Loader2, Filter, Star, Send, Target,
  Globe, Sparkles, Settings, User as UserIcon, Palette, Edit, Sun, Moon, ExternalLink
} from 'lucide-react';
import logo from '@/assets/logo.png';
import {
  getAllPublishedProjects, sendContactRequest, getSentContactRequests,
  DbProject, DbContactRequest
} from '@/lib/database';
import { upvoteProject, getUserUpvotes } from '@/lib/supabase-db';
import { getSupabase } from '@/lib/supabaseHelper';

const InvestorDashboard = () => {
  const { theme, setTheme } = useTheme();
  const { user, userRole, signOut, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState<DbProject[]>([]);
  const [sentRequests, setSentRequests] = useState<DbContactRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<DbProject | null>(null);
  const [contactMessage, setContactMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [upvotedProjectIds, setUpvotedProjectIds] = useState<string[]>([]);

  // Investor Matching state
  const [matchPanelOpen, setMatchPanelOpen] = useState(false);
  const [matchProjectId, setMatchProjectId] = useState<string>('');
  const [matchProjectTitle, setMatchProjectTitle] = useState<string>('');
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  // Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatContactRequest, setChatContactRequest] = useState<DbContactRequest | null>(null);
  const [chatProject, setChatProject] = useState<DbProject | null>(null);

  // AI Probability State
  const [projectScores, setProjectScores] = useState<Record<string, { score: number, analysis: string }>>({});
  const [fetchingScores, setFetchingScores] = useState<Record<string, boolean>>({});
  const [failedScores, setFailedScores] = useState<Record<string, boolean>>({});
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [aiStatus, setAiStatus] = useState<'connecting' | 'online' | 'offline'>('connecting');

  // Load data from database - fallback to Supabase if API not configured
  const loadData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Try external API first
      let projectsData: DbProject[] = [];
      let requestsData: DbContactRequest[] = [];

      try {
        [projectsData, requestsData] = await Promise.all([
          getAllPublishedProjects(),
          getSentContactRequests(user.id),
        ]);
      } catch (apiError) {
        console.log('External API not available:', apiError);
      }

      // Fallback to Supabase if API returns empty or fails
      if (projectsData.length === 0) {
        try {
          const supabase = await getSupabase();
          if (supabase) {
            const { data: supabaseProjects } = await supabase
              .from('projects')
              .select('*')
              .eq('status', 'published')
              .order('created_at', { ascending: false });

            if (supabaseProjects && supabaseProjects.length > 0) {
              projectsData = supabaseProjects.map(p => ({
                id: p.id,
                owner_clerk_id: p.clerk_user_id || p.owner_id,
                title: p.title,
                tagline: p.tagline,
                description: p.description,
                problem: p.problem,
                solution: p.solution,
                tech_stack: p.tech_stack,
                category: p.category,
                demo_url: p.demo_url,
                github_url: p.github_url,
                funding_goal: p.funding_goal,
                founder_name: p.founder_name,
                founder_avatar: p.founder_avatar,
                founder_university: p.founder_university,
                logo_url: p.logo_url,
                status: p.status,
                upvotes: (p as any).upvotes || 0,
                created_at: p.created_at,
                updated_at: p.updated_at,
              }));
            }
          }
        } catch (supabaseError) {
          console.log('Supabase fallback failed:', supabaseError);
        }
      }

      // Fallback contact requests from Supabase / localStorage
      if (requestsData.length === 0) {
        try {
          const supabase = await getSupabase();
          if (supabase) {
            const { data: supabaseRequests } = await supabase
              .from('contact_requests')
              .select('*')
              .eq('from_clerk_id', user.id);

            if (supabaseRequests) {
              requestsData = supabaseRequests.map(r => ({
                id: r.id,
                from_clerk_id: r.from_clerk_id,
                to_clerk_id: r.to_clerk_id,
                project_id: r.project_id,
                message: r.message,
                status: r.status || 'pending',
                created_at: r.created_at,
              }));
            }
          }
        } catch (supabaseError) {
          console.log('Supabase contact requests fallback failed:', supabaseError);
        }

        // If still empty (e.g. offline / mock mode), check localStorage
        if (requestsData.length === 0) {
          try {
            const localRequests = localStorage.getItem("vs_local_contact_requests") || "[]";
            const parsed = JSON.parse(localRequests) as DbContactRequest[];
            requestsData = parsed.filter(r => r.from_clerk_id === user.id);
          } catch (localError) {
            console.log('LocalStorage contact requests fallback failed:', localError);
          }
        }
      }

      setProjects(projectsData);
      setSentRequests(requestsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && userRole === 'investor') {
      loadData();
      
      // Fetch user's upvotes
      getUserUpvotes(user.id).then(ids => {
        setUpvotedProjectIds(ids);
      }).catch(err => console.error('Failed to fetch user upvotes:', err));
    }
  }, [user, userRole, loadData]);

  // Realtime subscription for instant project updates
  useEffect(() => {
    let channel: ReturnType<Awaited<ReturnType<typeof getSupabase>>['channel']> | null = null;

    (async () => {
      const supabase = await getSupabase();
      if (!supabase) return;

      channel = supabase
        .channel('investor-projects-realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'projects' },
          (payload) => {
            console.log('Investor dashboard realtime update:', payload);
            if (payload.eventType === 'INSERT') {
              const rawProject = payload.new as any;
              const newProject: DbProject = {
                id: rawProject.id,
                owner_clerk_id: rawProject.clerk_user_id || rawProject.owner_id || '',
                title: rawProject.title,
                tagline: rawProject.tagline,
                description: rawProject.description,
                problem: rawProject.problem,
                solution: rawProject.solution,
                tech_stack: rawProject.tech_stack,
                category: rawProject.category,
                demo_url: rawProject.demo_url,
                github_url: rawProject.github_url,
                funding_goal: rawProject.funding_goal,
                founder_name: rawProject.founder_name,
                founder_avatar: rawProject.founder_avatar,
                founder_university: rawProject.founder_university,
                logo_url: rawProject.logo_url,
                status: rawProject.status,
                upvotes: rawProject.upvotes || 0,
                created_at: rawProject.created_at,
                updated_at: rawProject.updated_at,
              };
              if (newProject.status === 'published') {
                setProjects((prev) => [newProject, ...prev]);
              }
            } else if (payload.eventType === 'UPDATE') {
              const rawProject = payload.new as any;
              const updated: DbProject = {
                id: rawProject.id,
                owner_clerk_id: rawProject.clerk_user_id || rawProject.owner_id || '',
                title: rawProject.title,
                tagline: rawProject.tagline,
                description: rawProject.description,
                problem: rawProject.problem,
                solution: rawProject.solution,
                tech_stack: rawProject.tech_stack,
                category: rawProject.category,
                demo_url: rawProject.demo_url,
                github_url: rawProject.github_url,
                funding_goal: rawProject.funding_goal,
                founder_name: rawProject.founder_name,
                founder_avatar: rawProject.founder_avatar,
                founder_university: rawProject.founder_university,
                logo_url: rawProject.logo_url,
                status: rawProject.status,
                upvotes: rawProject.upvotes || 0,
                created_at: rawProject.created_at,
                updated_at: rawProject.updated_at,
              };
              setProjects((prev) =>
                prev
                  .map((p) => (p.id === updated.id ? updated : p))
                  .filter((p) => p.status === 'published')
              );
            } else if (payload.eventType === 'DELETE') {
              const deleted = payload.old as { id: string };
              setProjects((prev) => prev.filter((p) => p.id !== deleted.id));
            }
          }
        )
        .subscribe();
    })();

    return () => {
      if (channel) {
        getSupabase().then((supabase) => {
          if (supabase && channel) supabase.removeChannel(channel);
        });
      }
    };
  }, []);

  // Redirect logic is handled centrally in <RequireRole /> (App routes).
  // Keep a minimal guard here to avoid rendering sensitive UI in edge cases.
  if (authLoading || !user || userRole !== 'investor') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-warning" />
      </div>
    );
  }

  const handleContactStudent = async () => {
    if (!selectedProject || !contactMessage.trim() || !user) return;

    setSendingMessage(true);
    try {
      const newRequest = await sendContactRequest({
        from_clerk_id: user.id,
        to_clerk_id: selectedProject.owner_clerk_id,
        project_id: selectedProject.id,
        message: contactMessage,
        from_user_name: user.fullName || 'Demo Investor',
        from_user_avatar: user.avatarUrl || undefined,
        project_title: selectedProject.title,
      });

      setSentRequests([...sentRequests, newRequest]);
      toast.success('Message sent to the student!');
      setContactDialogOpen(false);
      setContactMessage('');
      setSelectedProject(null);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleUpvote = async (projectId: string) => {
    if (!user || upvotedProjectIds.includes(projectId)) return;

    try {
      const newCount = await upvoteProject(projectId, user.id);
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, upvotes: newCount } : p));
      setUpvotedProjectIds(prev => [...prev, projectId]);
      toast.success('Project upvoted!');
    } catch (error) {
      console.error('Error upvoting project:', error);
      toast.error('Failed to upvote');
    }
  };

  const getRequestStatus = (projectId: string) => {
    const request = sentRequests.find(r => r.project_id === projectId);
    return request?.status || null;
  };

  const categories = ['all', ...new Set(projects.map(p => p.category).filter(Boolean))];

  const filteredProjects = projects
    .filter(project => {
      const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (project.tagline?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (Array.isArray(project.tech_stack) && project.tech_stack.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));
      const matchesCategory = categoryFilter === 'all' || project.category === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return 0;
    });

  // Fetch AI Scores for projects
  useEffect(() => {
    const fetchScores = async () => {
      const projectsToFetch = filteredProjects.filter(p => 
        !projectScores[p.id] && 
        !fetchingScores[p.id] && 
        !failedScores[p.id]
      );
      
      if (projectsToFetch.length === 0) {
        if (aiStatus === 'connecting') setAiStatus('online');
        return;
      }

      for (const project of projectsToFetch) {
        setFetchingScores(prev => ({ ...prev, [project.id]: true }));
        
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/predict-success`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: project.title,
              description: project.description || project.tagline || "",
              tech_stack: Array.isArray(project.tech_stack) ? project.tech_stack : [],
              funding_goal: project.funding_goal || 0
            })
          });
          
          if (response.ok) {
            const data = await response.json();
            setProjectScores(prev => ({ ...prev, [project.id]: { score: data.score, analysis: data.analysis } }));
            setAiStatus('online');
            setIsDemoMode(false);
          } else {
            throw new Error("Backend offline");
          }
        } catch (e) {
          console.warn(`AI Backend not reached for ${project.title}. Enabling Demo simulation...`);
          // FALLBACK: Simulate AI calculation for the demo if backend is offline
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const mockScore = 78 + Math.floor(Math.random() * 18);
          
          // Varied mock analyses based on category and random factor
          const variations = [
            `Strong ${project.category} potential with scalable architecture.`,
            `Exceptional technical readiness in ${project.title}.`,
            `High market fit predicted for this ${project.category} solution.`,
            `Disruptive potential in the ${project.category} space.`,
            `Robust founder profile and technical foundation.`
          ];
          const mockAnalysis = variations[Math.abs(project.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % variations.length];

          setAiStatus('offline');
          setProjectScores(prev => ({ 
            ...prev, 
            [project.id]: { 
              score: mockScore, 
              analysis: mockAnalysis
            } 
          }));
          setIsDemoMode(true);
        } finally {
          setFetchingScores(prev => ({ ...prev, [project.id]: false }));
        }
      }
    };

    if (filteredProjects.length > 0) {
      fetchScores();
    }
  }, [filteredProjects]);

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />

      {/* Header */}
      <header className="sticky top-0 z-50 glass-card-strong border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <img
                src={logo}
                alt="Vichaar Setu"
                className="h-9 w-9 object-contain rounded-lg"
              />
              <span className="font-display text-xl font-bold hidden sm:block">Vichaar Setu</span>
            </Link>
            <Badge className="badge-investor">
              <TrendingUp className="h-3 w-3" />
              Investor
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Settings className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent className="glass-card-strong border-l border-border/50 flex flex-col">
                <SheetHeader>
                  <SheetTitle className="font-display text-xl">Settings</SheetTitle>
                </SheetHeader>
                <ScrollArea className="flex-1 mt-6 pr-4">
                  <div className="space-y-6 pb-6">
                    {/* Profile Section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <UserIcon className="h-4 w-4" />
                        Profile
                      </div>
                      <div className="space-y-3 pl-6">
                        <Button variant="outline" className="w-full justify-start" asChild>
                          <Link to="/profile">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Profile
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => setPreferencesOpen(true)}
                        >
                          <Target className="h-4 w-4 mr-2" />
                          Investment Preferences
                        </Button>
                      </div>
                    </div>

                    {/* Appearance Section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Palette className="h-4 w-4" />
                        Appearance
                      </div>
                      <div className="space-y-3 pl-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                            <span className="text-sm">Dark mode</span>
                          </div>
                          <Switch
                            checked={theme === 'dark'}
                            onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Links Section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Globe className="h-4 w-4" />
                        Quick Links
                      </div>
                      <div className="space-y-2 pl-6">
                        <Button variant="ghost" className="w-full justify-start text-sm h-8" asChild>
                          <Link to="/about">About Us</Link>
                        </Button>
                        <Button variant="ghost" className="w-full justify-start text-sm h-8" asChild>
                          <Link to="/explore">Explore Startups</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-up">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
                Discover <span className="gradient-text-accent">Promising Startups</span>
              </h1>
              <p className="text-muted-foreground">
                Find innovative projects from talented students and connect with founders
              </p>
            </div>
            {aiStatus === 'connecting' && (
              <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5 px-4 py-2 flex items-center gap-2 animate-pulse h-fit">
                <Loader2 className="h-3 w-3 animate-spin" />
                Connecting to AI Engine...
              </Badge>
            )}
            {aiStatus === 'online' && (
              <Badge variant="outline" className="border-success/30 text-success bg-success/5 px-4 py-2 flex items-center gap-2 h-fit">
                <Sparkles className="h-3 w-3" />
                Live AI Engine: Online
              </Badge>
            )}
            {aiStatus === 'offline' && (
              <Badge variant="outline" className="border-warning/30 text-warning bg-warning/5 px-4 py-2 flex items-center gap-2 h-fit">
                <Rocket className="h-3 w-3" />
                Demo Mode: Simulation Active
              </Badge>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Active Projects', value: projects.length, icon: Rocket, color: 'bg-primary' },
            { label: 'Contacted', value: sentRequests.length, icon: MessageSquare, color: 'bg-accent' },
            { label: 'Accepted', value: sentRequests.filter(r => r.status === 'accepted').length, icon: Star, color: 'bg-success' },
            { label: 'Pending', value: sentRequests.filter(r => r.status === 'pending').length, icon: Send, color: 'bg-warning' },
          ].map((stat, i) => (
            <Card key={stat.label} className={`glass-card p-5 animate-fade-up stagger-${i + 1}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="font-display text-2xl font-bold">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.color}/10`}>
                  <stat.icon className={`h-5 w-5 text-primary`} />
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="explore" className="space-y-6">
          <div className="flex justify-center mb-2">
            <TabsList className="glass-card p-1 w-full max-w-md grid grid-cols-2">
              <TabsTrigger value="explore" className="font-display font-medium text-sm py-2">
                <Rocket className="h-4 w-4 mr-2" />
                Explore Projects
              </TabsTrigger>
              <TabsTrigger value="smart-search" className="font-display font-medium text-sm py-2">
                <Sparkles className="h-4 w-4 mr-2" />
                Smart AI Search
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="explore" className="space-y-6 animate-in fade-in-50 duration-200">

        {/* Search & Filters */}
        <Card className="glass-card p-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects, tech stack, categories..."
                className="pl-10 bg-secondary/50"
              />
            </div>
            <div className="flex gap-3">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40 bg-secondary/50">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {cat === 'all' ? 'All Categories' : cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-32 bg-secondary/50">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="popular">Popular</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Projects Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredProjects.length === 0 ? (
          <Card className="glass-card p-12 text-center">
            <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-display text-lg font-semibold mb-2">No projects found</h3>
            <p className="text-muted-foreground">Try adjusting your filters or check back later</p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project, i) => {
              const requestStatus = getRequestStatus(project.id);

              return (
                <Card
                  key={project.id}
                  className={`glass-card overflow-hidden hover-lift animate-fade-up stagger-${(i % 5) + 1} group`}
                >
                  {/* Header */}
                  <div className="p-6 pb-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="h-14 w-14 rounded-2xl bg-primary-gradient flex items-center justify-center text-primary-foreground font-display font-bold text-xl">
                        {project.title[0]}
                      </div>
                      {project.category && (
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant="secondary" className="px-2 py-0 h-5 text-[10px] uppercase tracking-wider">{project.category}</Badge>
                          {projectScores[project.id] ? (
                            <div className="flex flex-col items-end">
                              <Badge className="bg-primary/20 text-primary border-primary/30 font-bold flex items-center gap-1.5 animate-in fade-in zoom-in duration-500 shadow-[0_0_12px_rgba(var(--primary-glow),0.4)] hover:shadow-[0_0_20px_rgba(var(--primary-glow),0.6)] transition-shadow">
                                <Sparkles className="h-3 w-3" />
                                {projectScores[project.id].score}% AI Score
                              </Badge>
                              <span className="text-[9px] text-muted-foreground mt-1 max-w-[120px] text-right line-clamp-2 italic">
                                "{projectScores[project.id].analysis}"
                              </span>
                            </div>
                          ) : fetchingScores[project.id] ? (
                            <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-secondary/30 border border-border/50">
                              <Loader2 className="h-2.5 w-2.5 animate-spin text-primary" />
                              <span className="text-[8px] uppercase font-bold tracking-tighter text-muted-foreground">Analyzing...</span>
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>
                    <Link to={`/startup/${project.id}`}>
                      <h3 className="font-display text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                        {project.title}
                      </h3>
                    </Link>
                    {project.tagline && (
                      <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                        {project.tagline}
                      </p>
                    )}

                    {/* Founder */}
                    <div className="flex items-center gap-2 mb-4">
                      <img
                        src={project.founder_avatar || '/placeholder.svg'}
                        alt={project.founder_name || 'Founder'}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                      <div>
                        <p className="text-sm font-medium">{project.founder_name || 'Anonymous'}</p>
                        {project.founder_university && (
                          <p className="text-xs text-muted-foreground">{project.founder_university}</p>
                        )}
                      </div>
                    </div>

                    {/* Tech Stack */}
                    {project.tech_stack && Array.isArray(project.tech_stack) && project.tech_stack.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {project.tech_stack.slice(0, 3).map((tech) => (
                          <Badge key={tech} variant="outline" className="text-xs">
                            {tech}
                          </Badge>
                        ))}
                        {project.tech_stack.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{project.tech_stack.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="p-4 pt-0 flex flex-wrap gap-2">
                    <Button variant="hero" size="sm" className="h-8 shadow-sm" asChild title="Generate Pitch Deck, Diagrams & Business Plan">
                      <Link to={`/startup/${project.id}#ai-copilot`}>
                        <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                        AI Co-Pilot
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 border-primary/30 text-primary hover:bg-primary/10"
                      onClick={() => {
                        setMatchProjectId(project.id);
                        setMatchProjectTitle(project.title);
                        setMatchPanelOpen(true);
                      }}
                      title="AI Investor Matching"
                    >
                      <Target className="h-3.5 w-3.5 mr-1.5" />
                      Match
                    </Button>
                    {project.demo_url && (
                      <Button variant="outline" size="sm" className="flex-1" asChild>
                        <a href={project.demo_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                          Demo
                        </a>
                      </Button>
                    )}
                    {project.github_url && (
                      <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                        <a href={project.github_url} target="_blank" rel="noopener noreferrer">
                          <Github className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    )}
                    <Button 
                      variant={upvotedProjectIds.includes(project.id) ? "secondary" : "outline"} 
                      size="sm" 
                      className={`flex-col h-auto py-1 px-3 gap-0 transition-colors ${upvotedProjectIds.includes(project.id) ? "opacity-70 cursor-not-allowed" : "group-hover:border-primary text-foreground"}`}
                      onClick={(e) => {
                        e.preventDefault();
                        if (upvotedProjectIds.includes(project.id)) {
                          toast.info('You have already upvoted this project');
                          return;
                        }
                        handleUpvote(project.id);
                      }}
                      title={upvotedProjectIds.includes(project.id) ? "Already upvoted" : "Upvote"}
                    >
                      <TrendingUp className={`h-3 w-3 ${upvotedProjectIds.includes(project.id) ? "text-muted-foreground" : "text-primary"}`} />
                      <span className="text-[10px] font-bold">{project.upvotes || 0}</span>
                    </Button>
                    {requestStatus ? (
                      <div className="flex items-center gap-1.5">
                        {requestStatus === 'accepted' ? (
                          <Button
                            size="sm"
                            className="bg-primary-gradient h-8 gap-1.5"
                            onClick={() => {
                              const req = sentRequests.find(r => r.project_id === project.id);
                              if (req) {
                                setChatContactRequest(req);
                                setChatProject(project);
                                setChatOpen(true);
                              }
                            }}
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            Chat
                          </Button>
                        ) : (
                          <Badge
                            className={`h-8 px-3 ${
                              requestStatus === 'pending' ? 'bg-warning' : 'bg-muted'
                            }`}
                          >
                            {requestStatus === 'pending' ? '⏳ Pending' : requestStatus}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        className="flex-1 bg-primary-gradient"
                        onClick={() => {
                          setSelectedProject(project);
                          setContactDialogOpen(true);
                        }}
                      >
                        <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                        Contact
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
          </TabsContent>

          <TabsContent value="smart-search" className="space-y-6 animate-in fade-in-50 duration-200">
            <SmartSearch />
          </TabsContent>
        </Tabs>
      </main>

      {/* Contact Dialog */}
      <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
        <DialogContent className="glass-card-strong">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              Contact {selectedProject?.founder_name || 'Founder'}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Send a message to the project founder.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-muted-foreground text-sm">
              Send a message about <span className="font-medium text-foreground">{selectedProject?.title}</span>
            </p>
            <Textarea
              value={contactMessage}
              onChange={(e) => setContactMessage(e.target.value)}
              placeholder="Introduce yourself and explain your interest in this project..."
              rows={4}
            />
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setContactDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-primary-gradient"
                onClick={handleContactStudent}
                disabled={sendingMessage || !contactMessage.trim()}
              >
                {sendingMessage ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                Send Message
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Encrypted Chat Dialog */}
      <Dialog open={chatOpen} onOpenChange={(open) => {
        setChatOpen(open);
        if (!open) {
          setChatContactRequest(null);
          setChatProject(null);
        }
      }}>
        <DialogContent className="glass-card-strong sm:max-w-lg p-0 gap-0 overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Chat with {chatProject?.founder_name || 'Student'}</DialogTitle>
            <DialogDescription>Encrypted conversation</DialogDescription>
          </DialogHeader>
          {chatContactRequest && chatProject && user && (
            <ChatPanel
              contactRequestId={chatContactRequest.id}
              currentUserClerkId={user.id}
              otherUserClerkId={chatContactRequest.to_clerk_id}
              otherUserName={chatProject.founder_name || 'Student'}
              otherUserAvatar={chatProject.founder_avatar || undefined}
              projectTitle={chatProject.title}
              onClose={() => {
                setChatOpen(false);
                setChatContactRequest(null);
                setChatProject(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* AI Investor Matching Panel */}
      <InvestorMatchPanel
        projectId={matchProjectId}
        projectTitle={matchProjectTitle}
        isOpen={matchPanelOpen}
        onClose={() => {
          setMatchPanelOpen(false);
          setMatchProjectId('');
          setMatchProjectTitle('');
        }}
      />

      {/* Investor Preferences Dialog */}
      {user && (
        <InvestorPreferencesDialog
          isOpen={preferencesOpen}
          onClose={() => setPreferencesOpen(false)}
          investorClerkId={user.id}
        />
      )}
    </div>
  );
};

export default InvestorDashboard;
