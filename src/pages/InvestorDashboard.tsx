import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { useAuth } from '@/contexts/AuthContext';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  TrendingUp, LogOut, Search, Rocket, MessageSquare,
  Github, Loader2, Filter, Star, Send,
  Globe, Sparkles, Settings, User, Palette, Edit, Sun, Moon, ExternalLink
} from 'lucide-react';
import logo from '@/assets/logo.png';
import { 
  getAllPublishedProjects, sendContactRequest, getSentContactRequests,
  DbProject, DbContactRequest
} from '@/lib/database';
import { getSupabase } from '@/lib/supabaseHelper';

const InvestorDashboard = () => {
  const navigate = useNavigate();
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
                owner_clerk_id: p.owner_id,
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
                created_at: p.created_at,
                updated_at: p.updated_at,
              }));
            }
          }
        } catch (supabaseError) {
          console.log('Supabase fallback failed:', supabaseError);
        }
      }
      
      // Fallback contact requests from Supabase
      if (requestsData.length === 0) {
        try {
          const supabase = await getSupabase();
          if (supabase) {
            const { data: supabaseRequests } = await supabase
              .from('contact_requests')
              .select('*')
              .eq('from_user_id', user.id);
            
            if (supabaseRequests) {
              requestsData = supabaseRequests.map(r => ({
                id: r.id,
                from_clerk_id: r.from_user_id,
                to_clerk_id: r.to_user_id,
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
    }
  }, [user, userRole, loadData]);

  // Redirect if not authenticated or not an investor
  useEffect(() => {
    if (!authLoading && (!user || userRole !== 'investor')) {
      navigate('/auth');
    }
  }, [authLoading, user, userRole, navigate]);

  if (authLoading || !user) {
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

  const getRequestStatus = (projectId: string) => {
    const request = sentRequests.find(r => r.project_id === projectId);
    return request?.status || null;
  };

  const categories = ['all', ...new Set(projects.map(p => p.category).filter(Boolean))];

  const filteredProjects = projects
    .filter(project => {
      const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (project.tagline?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        project.tech_stack?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = categoryFilter === 'all' || project.category === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return 0;
    });

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
                        <User className="h-4 w-4" />
                        Profile
                      </div>
                      <div className="space-y-3 pl-6">
                        <Button variant="outline" className="w-full justify-start" asChild>
                          <Link to="/profile">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Profile
                          </Link>
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
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
            Discover <span className="gradient-text-accent">Promising Startups</span>
          </h1>
          <p className="text-muted-foreground">
            Find innovative projects from talented students and connect with founders
          </p>
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
                        <Badge variant="secondary">{project.category}</Badge>
                      )}
                    </div>
                    <h3 className="font-display text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                      {project.title}
                    </h3>
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
                    {project.tech_stack && project.tech_stack.length > 0 && (
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
                  <div className="p-4 pt-0 flex gap-2">
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
                    {requestStatus ? (
                      <Badge 
                        className={`h-8 px-3 ${
                          requestStatus === 'accepted' ? 'bg-success' : 
                          requestStatus === 'pending' ? 'bg-warning' : 'bg-muted'
                        }`}
                      >
                        {requestStatus === 'accepted' ? '✓ Accepted' : 
                         requestStatus === 'pending' ? '⏳ Pending' : requestStatus}
                      </Badge>
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
      </main>

      {/* Contact Dialog */}
      <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
        <DialogContent className="glass-card-strong">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              Contact {selectedProject?.founder_name || 'Founder'}
            </DialogTitle>
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
    </div>
  );
};

export default InvestorDashboard;
