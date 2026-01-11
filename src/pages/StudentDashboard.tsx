import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { useAuth } from '@/contexts/AuthContext';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  GraduationCap, Plus, LogOut, Rocket, Users, Eye, MessageSquare,
  ExternalLink, Github, Edit, Trash2, Loader2, FolderOpen, Bell, Settings,
  User, Lock, BellRing, Palette, Globe, Sun, Moon, Check, X
} from 'lucide-react';
import logo from '@/assets/logo.png';
import { 
  createProject, getProjectsByOwner, updateProject, deleteProject,
  getContactRequestsForUser, updateContactRequestStatus,
  DbProject, DbContactRequest
} from '@/lib/database';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { user, userRole, signOut, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState<DbProject[]>([]);
  const [contactRequests, setContactRequests] = useState<DbContactRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<DbProject | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    tagline: '',
    description: '',
    problem: '',
    solution: '',
    tech_stack: '',
    category: '',
    demo_url: '',
    github_url: '',
    funding_goal: '',
  });

  // Load data from database
  const loadData = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const [projectsData, requestsData] = await Promise.all([
        getProjectsByOwner(user.id),
        getContactRequestsForUser(user.id),
      ]);
      setProjects(projectsData);
      setContactRequests(requestsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && userRole === 'student') {
      loadData();
    }
  }, [user, userRole, loadData]);

  // Redirect if not authenticated or not a student
  useEffect(() => {
    if (!authLoading && (!user || userRole !== 'student')) {
      navigate('/auth');
    }
  }, [authLoading, user, userRole, navigate]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleSubmitProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setSubmitting(true);
    try {
      const projectData = {
        clerk_id: user.id,
        title: formData.title,
        tagline: formData.tagline || undefined,
        description: formData.description || undefined,
        problem: formData.problem || undefined,
        solution: formData.solution || undefined,
        tech_stack: formData.tech_stack ? formData.tech_stack.split(',').map(t => t.trim()).filter(Boolean) : undefined,
        category: formData.category || undefined,
        demo_url: formData.demo_url || undefined,
        github_url: formData.github_url || undefined,
        funding_goal: formData.funding_goal ? parseFloat(formData.funding_goal) : undefined,
        founder_name: user.fullName || user.firstName || 'Anonymous',
        founder_avatar: user.imageUrl,
        status: 'published',
      };

      if (editingProject) {
        const updated = await updateProject(editingProject.id, projectData);
        setProjects(projects.map(p => p.id === editingProject.id ? updated : p));
        toast.success('Project updated!');
      } else {
        const newProject = await createProject(projectData);
        setProjects([newProject, ...projects]);
        toast.success('Project created!');
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error('Failed to save project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!user) return;
    
    try {
      await deleteProject(id, user.id);
      setProjects(projects.filter(p => p.id !== id));
      toast.success('Project deleted');
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    }
  };

  const handleEditProject = (project: DbProject) => {
    setEditingProject(project);
    setFormData({
      title: project.title || '',
      tagline: project.tagline || '',
      description: project.description || '',
      problem: project.problem || '',
      solution: project.solution || '',
      tech_stack: project.tech_stack?.join(', ') || '',
      category: project.category || '',
      demo_url: project.demo_url || '',
      github_url: project.github_url || '',
      funding_goal: project.funding_goal?.toString() || '',
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingProject(null);
    setFormData({
      title: '',
      tagline: '',
      description: '',
      problem: '',
      solution: '',
      tech_stack: '',
      category: '',
      demo_url: '',
      github_url: '',
      funding_goal: '',
    });
  };

  const handleRespondToRequest = async (requestId: string, status: 'accepted' | 'declined') => {
    if (!user) return;
    
    try {
      await updateContactRequestStatus(requestId, status, user.id);
      setContactRequests(contactRequests.map(r => 
        r.id === requestId ? { ...r, status } : r
      ));
      toast.success(`Request ${status}`);
    } catch (error) {
      console.error('Error responding to request:', error);
      toast.error('Failed to update request');
    }
  };

  const pendingCount = contactRequests.filter(r => r.status === 'pending').length;

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
            <Badge className="badge-student">
              <GraduationCap className="h-3 w-3" />
              Student
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-bold flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </Button>
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
            Welcome back, <span className="gradient-text">{user.firstName || 'Innovator'}</span>
          </h1>
          <p className="text-muted-foreground">
            Manage your projects and connect with investors
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Projects', value: projects.length, icon: Rocket },
            { label: 'Investor Inquiries', value: contactRequests.length, icon: MessageSquare },
            { label: 'Pending', value: pendingCount, icon: Bell },
          ].map((stat, i) => (
            <Card key={stat.label} className={`glass-card p-6 animate-fade-up stagger-${i + 1}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="font-display text-2xl font-bold">{stat.value}</p>
                </div>
                <div className="p-3 rounded-xl bg-primary/10">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="projects" className="space-y-6">
          <TabsList className="glass-card">
            <TabsTrigger value="projects" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Rocket className="h-4 w-4 mr-2" />
              My Projects
            </TabsTrigger>
            <TabsTrigger value="inquiries" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <MessageSquare className="h-4 w-4 mr-2" />
              Inquiries
              {pendingCount > 0 && (
                <span className="ml-2 h-5 w-5 rounded-full bg-primary text-[10px] font-bold flex items-center justify-center text-primary-foreground">
                  {pendingCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold">Your Projects</h2>
              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button className="bg-primary-gradient hover:opacity-90">
                    <Plus className="h-4 w-4 mr-2" />
                    New Project
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-card-strong max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="font-display text-xl">
                      {editingProject ? 'Edit Project' : 'Create New Project'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmitProject} className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Project Title</Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          placeholder="My Awesome Startup"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="AI & ML">AI & ML</SelectItem>
                            <SelectItem value="SaaS">SaaS</SelectItem>
                            <SelectItem value="Developer Tools">Developer Tools</SelectItem>
                            <SelectItem value="Fintech">Fintech</SelectItem>
                            <SelectItem value="Health & Wellness">Health & Wellness</SelectItem>
                            <SelectItem value="E-commerce">E-commerce</SelectItem>
                            <SelectItem value="Productivity">Productivity</SelectItem>
                            <SelectItem value="Education">Education</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tagline">Tagline</Label>
                      <Input
                        id="tagline"
                        value={formData.tagline}
                        onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                        placeholder="A brief catchy description"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Describe your project in detail..."
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="problem">Problem</Label>
                        <Textarea
                          id="problem"
                          value={formData.problem}
                          onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
                          placeholder="What problem does it solve?"
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="solution">Solution</Label>
                        <Textarea
                          id="solution"
                          value={formData.solution}
                          onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
                          placeholder="How does it solve the problem?"
                          rows={2}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tech_stack">Tech Stack</Label>
                      <Input
                        id="tech_stack"
                        value={formData.tech_stack}
                        onChange={(e) => setFormData({ ...formData, tech_stack: e.target.value })}
                        placeholder="React, Node.js, PostgreSQL (comma-separated)"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="demo_url">Demo URL</Label>
                        <Input
                          id="demo_url"
                          value={formData.demo_url}
                          onChange={(e) => setFormData({ ...formData, demo_url: e.target.value })}
                          placeholder="https://demo.example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="github_url">GitHub URL</Label>
                        <Input
                          id="github_url"
                          value={formData.github_url}
                          onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                          placeholder="https://github.com/..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="funding_goal">Funding Goal ($)</Label>
                        <Input
                          id="funding_goal"
                          type="number"
                          value={formData.funding_goal}
                          onChange={(e) => setFormData({ ...formData, funding_goal: e.target.value })}
                          placeholder="50000"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button type="button" variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" className="flex-1 bg-primary-gradient" disabled={submitting}>
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        {editingProject ? 'Update' : 'Create'} Project
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : projects.length === 0 ? (
              <Card className="glass-card p-12 text-center">
                <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-display text-lg font-semibold mb-2">No projects yet</h3>
                <p className="text-muted-foreground mb-4">Create your first project to get started</p>
                <Button onClick={() => setIsDialogOpen(true)} className="bg-primary-gradient">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Project
                </Button>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project, i) => (
                  <Card key={project.id} className={`glass-card overflow-hidden animate-fade-up stagger-${(i % 5) + 1}`}>
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="h-12 w-12 rounded-xl bg-primary-gradient flex items-center justify-center text-primary-foreground font-display font-bold text-lg">
                          {project.title[0]}
                        </div>
                        <Badge variant={project.status === 'published' ? 'default' : 'secondary'}>
                          {project.status}
                        </Badge>
                      </div>
                      <h3 className="font-display text-lg font-bold mb-2">{project.title}</h3>
                      {project.tagline && (
                        <p className="text-muted-foreground text-sm line-clamp-2 mb-4">{project.tagline}</p>
                      )}
                      {project.tech_stack && project.tech_stack.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {project.tech_stack.slice(0, 3).map((tech) => (
                            <Badge key={tech} variant="outline" className="text-xs">{tech}</Badge>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
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
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditProject(project)}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteProject(project.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="inquiries" className="space-y-4">
            <h2 className="font-display text-xl font-semibold">Investor Inquiries</h2>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : contactRequests.length === 0 ? (
              <Card className="glass-card p-12 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-display text-lg font-semibold mb-2">No inquiries yet</h3>
                <p className="text-muted-foreground">
                  When investors reach out, their messages will appear here
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {contactRequests.map((request, i) => (
                  <Card key={request.id} className={`glass-card p-6 animate-fade-up stagger-${(i % 5) + 1}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <img 
                          src={request.from_user_avatar || '/placeholder.svg'} 
                          alt={request.from_user_name || 'Investor'} 
                          className="h-12 w-12 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-semibold">{request.from_user_name || 'Investor'}</p>
                          <p className="text-sm text-muted-foreground mb-2">
                            Regarding: {request.project_title || 'Your project'}
                          </p>
                          <p className="text-sm">{request.message}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(request.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {request.status === 'pending' ? (
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-green-500 text-green-500 hover:bg-green-500/10"
                            onClick={() => handleRespondToRequest(request.id, 'accepted')}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Accept
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-destructive text-destructive hover:bg-destructive/10"
                            onClick={() => handleRespondToRequest(request.id, 'declined')}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Decline
                          </Button>
                        </div>
                      ) : (
                        <Badge variant={request.status === 'accepted' ? 'default' : 'secondary'}>
                          {request.status}
                        </Badge>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default StudentDashboard;
