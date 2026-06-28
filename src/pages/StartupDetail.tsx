import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUp,
  ExternalLink,
  Github,
  Share2,
  Star,
  MessageCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import StartupCard from "@/components/startup/StartupCard";
import Mermaid from "@/components/ui/Mermaid";
import ReactMarkdown from 'react-markdown';
import { getStartupById, startups } from "@/data/mockData";
import { getProjectById, Project, upvoteProject, getUserUpvotes } from "@/lib/supabase-db";
import { toast } from "sonner";

// Helper type matching the UI structure
type ProjectUI = {
  id: string;
  name: string;
  logo: string;
  tagline: string;
  description: string;
  category: string;
  problem?: string;
  solution?: string;
  techStack?: string[];
  website?: string;
  github?: string;
  upvotes: number;
  isFeatured?: boolean;
  founder: {
    name: string;
    avatar: string;
    github?: string;
    bio?: string;
  };
};

const StartupDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<ProjectUI | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiScore, setAiScore] = useState<{ score: number, analysis: string } | null>(null);
  const [fetchingScore, setFetchingScore] = useState(false);
  const [failedScore, setFailedScore] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [generatingAssets, setGeneratingAssets] = useState(false);
  const [aiAssets, setAiAssets] = useState<{
    business_plan?: string;
    mermaid_diagram?: string;
    logo_base64?: string;
  } | null>(null);
  const { user } = useAuth();
  const [upvotedProjectIds, setUpvotedProjectIds] = useState<string[]>([]);

  // Scroll to top or specific section when page loads
  useEffect(() => {
    if (window.location.hash === '#ai-copilot') {
      const element = document.getElementById('ai-copilot-section');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [id, aiAssets]); // Re-run when assets generate too

  useEffect(() => {
    const fetchProjectData = async () => {
      if (!id) return;
      setLoading(true);
      
      try {
        // Try getting it from the API / Database first
        let dbProject: Project | null = null;
        
        try {
          dbProject = await getProjectById(id);
        } catch (e) {
          console.error("Failed to fetch project from Supabase DB:", e);
        }

        if (dbProject) {
          // Safely parse tech_stack ensuring it's an Array to avoid .map() crashes
          let safeTechStack: string[] = [];
          if (Array.isArray(dbProject.tech_stack)) {
            safeTechStack = dbProject.tech_stack;
          } else if (typeof dbProject.tech_stack === 'string') {
            safeTechStack = (dbProject.tech_stack as string).replace(/[{}]/g, '').split(',').map((s: string) => s.trim()).filter(Boolean);
          }

          // Map DbProject to ProjectUI
          setProject({
            id: dbProject.id || id,
            name: dbProject.title || "Untitled Project",
            logo: (dbProject as any).logo_url || "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=500&q=80",
            tagline: dbProject.tagline || "",
            description: dbProject.description || "No description provided.",
            category: dbProject.category || "Uncategorized",
            problem: dbProject.problem || undefined,
            solution: dbProject.solution || undefined,
            techStack: safeTechStack,
            website: dbProject.demo_url || undefined,
            github: dbProject.github_url || undefined,
            upvotes: dbProject.upvotes || 0,
            isFeatured: dbProject.status === "published",
            founder: {
              name: dbProject.founder_name || "Anonymous",
              avatar: dbProject.founder_avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80",
              bio: dbProject.category ? `Building in ${dbProject.category}` : undefined,
              github: dbProject.github_url ? dbProject.github_url : undefined,
            }
          });
        } else {
          // Fallback to mock data if it wasn't a UUID
          const mockProject = getStartupById(id);
          if (mockProject) {
            setProject(mockProject);
          } else {
            setProject(null);
          }
        }
      } catch (error) {
        console.error("Failed to fetch project details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectData();
    
    // Fetch user upvotes if logged in
    if (user) {
      getUserUpvotes(user.id).then(ids => {
        setUpvotedProjectIds(ids);
      }).catch(err => console.error("Failed to fetch user upvotes:", err));
    }
  }, [id, user]);

  // Fetch AI Success Score
  useEffect(() => {
    const getAiScore = async () => {
      if (!project || aiScore || fetchingScore || failedScore) return;
      
      setFetchingScore(true);
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/predict-success`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: project.name,
            description: project.description,
            tech_stack: project.techStack || [],
            // funding_goal is not in ProjectUI yet, so we'll pass 0 or update the mapping
            funding_goal: 0 
          })
        });

        if (response.ok) {
          const data = await response.json();
          setAiScore({ score: data.score, analysis: data.analysis });
        } else {
          throw new Error("Backend offline");
        }
      } catch (e) {
        console.warn("AI Backend offline for details. Simulating result...");
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const mockScore = 82 + Math.floor(Math.random() * 14);
        const detailedVariations = [
          "Our internal model identifies a strong overlap between the technical stack and current market trends. Technical readiness score is exceptional for this stage.",
          "Scalability analysis suggests this architecture can handle 10x growth with minimal refactoring. Strong potential for high-volume data processing.",
          "Market fit score is elevated due to the unique solution approach in this category. Competitor analysis indicates a significant first-mover advantage.",
          "High founder-product fit detected. The proposed technical roadmap aligns well with industry best practices for security and efficiency."
        ];
        const mockAnalysis = detailedVariations[Math.abs(project.name.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % detailedVariations.length];

        setAiScore({ 
          score: mockScore, 
          analysis: mockAnalysis
        });
        setIsDemoMode(true);
      } finally {
        setFetchingScore(false);
      }
    };

    getAiScore();
  }, [project, aiScore, fetchingScore, failedScore]);

  const handleUpvote = async (projectId?: string) => {
    const targetId = projectId || id;
    if (!project || !targetId || !user) return;
    
    if (upvotedProjectIds.includes(targetId)) {
      toast.info("You have already upvoted this project");
      return;
    }
    
    try {
      const newCount = await upvoteProject(targetId, user.id);
      setUpvotedProjectIds(prev => [...prev, targetId]);
      
      // If we upvoted the main project on this page, update its state
      if (targetId === id) {
        setProject(prev => prev ? { ...prev, upvotes: newCount } : null);
      } else {
        toast.info("Upvote registered!");
      }
      toast.success("Project upvoted!");
    } catch (error) {
      console.error("Failed to upvote:", error);
      toast.error("Failed to register upvote");
    }
  };

  const handleShare = () => {
    const deployUrl = "https://vichaar-setu.vercel.app";
    const shareUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
    const finalUrl = shareUrl.includes('localhost') ? shareUrl : deployUrl + window.location.pathname;

    navigator.clipboard.writeText(finalUrl);
    toast.success("Link copied to clipboard!");
  };

  const handleGeneratePitch = async () => {
    if (!project) return;
    setGeneratingAssets(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/generate-pitch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: project.name,
          description: project.description,
          tech_stack: project.techStack || [],
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAiAssets(data);
        toast.success("AI Co-Pilot has generated your pitch assets!");
      } else {
        throw new Error("AI Engine error");
      }
    } catch (e) {
      console.error("Failed to generate AI pitch:", e);
      toast.error("Failed to generate AI assets. Ensure your Python Engine is online.");
    } finally {
      setGeneratingAssets(false);
    }
  };

  // Get related projects
  const relatedProjects = project
    ? startups.filter(s => s.category === project.category && s.id !== project.id).slice(0, 3)
    : [];

  if (loading) {
    return (
      <Layout>
        <div className="container py-20 flex justify-center items-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="font-display text-3xl font-bold mb-4">Startup Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The startup you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild>
            <Link to="/explore">Browse Startups</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header */}
      <section className="border-b border-border/50 bg-card/30">
        <div className="container py-6">
          <Link
            to="/explore"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Explore
          </Link>

          <div className="flex flex-col lg:flex-row gap-6 lg:items-start">
            {/* Logo */}
            <div className="flex-shrink-0">
              <div className="h-24 w-24 lg:h-32 lg:w-32 rounded-2xl bg-secondary overflow-hidden ring-1 ring-border/50 shadow-soft">
                <img
                  src={project.logo}
                  alt={project.name}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="font-display text-3xl lg:text-4xl font-bold">
                  {project.name}
                </h1>
                {project.isFeatured && (
                  <span className="badge-featured">
                    <Star className="h-3 w-3" />
                    Featured
                  </span>
                )}
                {aiScore && (
                  <Badge className={`bg-primary/20 text-primary border-primary/30 font-bold py-1.5 px-4 flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-700 shadow-[0_0_15px_rgba(245,158,11,0.4)] ${isDemoMode ? 'border-dashed opacity-90' : ''}`}>
                    <Sparkles className="h-4 w-4" />
                    {aiScore.score}% AI Confidence Score
                    {isDemoMode && <span className="text-[9px] opacity-60 ml-2">(PREVIEW)</span>}
                  </Badge>
                )}
              </div>

              <p className="text-lg text-muted-foreground mb-4">
                {project.tagline}
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <Badge variant="secondary" className="text-sm">
                  {project.category}
                </Badge>
                <div className="flex items-center gap-2">
                  <img
                    src={project.founder.avatar}
                    alt={project.founder.name}
                    className="h-6 w-6 rounded-full ring-1 ring-border"
                  />
                  <span className="text-sm text-muted-foreground">
                    by{" "}
                    <span className="text-foreground">
                      {project.founder.name}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-3">
              <Button variant="hero" size="sm" className="h-8 shadow-sm" asChild title="Generate Pitch Deck, Diagrams & Business Plan">
                <Link to={`/startup/${project.id}#ai-copilot`}>
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  AI Co-Pilot
                </Link>
              </Button>
              <Button 
                variant={id && upvotedProjectIds.includes(id) ? "secondary" : "hero"} 
                size="lg" 
                className={`gap-2 transition-all active:scale-95 ${id && upvotedProjectIds.includes(id) ? "opacity-70 cursor-not-allowed" : ""}`}
                onClick={() => handleUpvote()}
                disabled={id && upvotedProjectIds.includes(id)}
              >
                <ArrowUp className="h-5 w-5" />
                {id && upvotedProjectIds.includes(id) ? "Upvoted" : "Upvote"} ({project.upvotes})
              </Button>
              <div className="flex gap-2">
                {project.website && (
                  <Button variant="outline" size="lg" asChild className="flex-1 lg:flex-none">
                    <a
                      href={project.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Demo
                    </a>
                  </Button>
                )}
                {project.github && (
                  <Button variant="outline" size="icon" asChild>
                    <a
                      href={project.github}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Github className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={handleShare}
                  title="Share Project"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="container py-12">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-10">
            {/* Overview */}
            <section>
              <h2 className="font-display text-xl font-semibold mb-4">Overview</h2>
              <p className="text-muted-foreground leading-relaxed">
                {project.description}
              </p>
            </section>

            {/* Problem */}
            {project.problem && (
              <section className="glass-card rounded-2xl p-6">
                <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                    ?
                  </span>
                  The Problem
                </h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {project.problem}
                </p>
              </section>
            )}

            {/* Solution */}
            {project.solution && (
              <section className="glass-card rounded-2xl p-6">
                <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    ✓
                  </span>
                  The Solution
                </h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {project.solution}
                </p>
              </section>
            )}

            {/* Tech Stack */}
            {Array.isArray(project.techStack) && project.techStack.length > 0 && (
              <section>
                <h2 className="font-display text-xl font-semibold mb-4">
                  Tech Stack
                </h2>
                <div className="flex flex-wrap gap-2">
                  {project.techStack.map((tech: string) => (
                    <Badge
                      key={tech}
                      variant="secondary"
                      className="px-4 py-2 text-sm"
                    >
                      {tech}
                    </Badge>
                  ))}
                </div>
              </section>
            )}

            {/* AI Co-Pilot Section */}
            <section id="ai-copilot-section" className="relative overflow-hidden group scroll-mt-20">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-50 pointer-events-none" />
              <div className="glass-card rounded-3xl p-8 border-primary/20 relative">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                  <div>
                    <h2 className="font-display text-2xl font-bold flex items-center gap-3 text-foreground mb-2">
                      <div className="p-2 bg-primary/10 rounded-xl">
                        <Sparkles className="h-6 w-6 text-primary animate-pulse" />
                      </div>
                      AI Co-Pilot Engine
                    </h2>
                    <p className="text-muted-foreground">
                      Use our specialized Python AI to generate expert startup assets.
                    </p>
                  </div>
                  <Button 
                    variant="hero" 
                    size="lg" 
                    onClick={handleGeneratePitch}
                    disabled={generatingAssets}
                    className="shadow-xl shadow-primary/20 relative overflow-hidden group/btn"
                  >
                    {generatingAssets ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        Analyzing Startup...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5 mr-2 group-hover/btn:rotate-12 transition-transform" />
                        {aiAssets ? "Regenerate Pitch Assets" : "Generate AI Pitch Deck"}
                      </>
                    )}
                  </Button>
                </div>

                {!aiAssets && !generatingAssets && (
                  <div className="grid sm:grid-cols-3 gap-4">
                    {[
                      { icon: "📄", title: "Business Plan", desc: "Expert assessment" },
                      { icon: "📊", title: "Architecture", desc: "System diagram" },
                      { icon: "🎨", title: "Custom Logo", desc: "Stable Diffusion" }
                    ].map((item, i) => (
                      <div key={i} className="p-4 rounded-2xl bg-secondary/30 border border-border/50 text-center">
                        <div className="text-2xl mb-2">{item.icon}</div>
                        <div className="text-sm font-bold">{item.title}</div>
                        <div className="text-[10px] text-muted-foreground uppercase">{item.desc}</div>
                      </div>
                    ))}
                  </div>
                )}

                {aiAssets && (
                  <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    {/* Logo & Plan Header */}
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                      {aiAssets.logo_base64 && (
                        <div className="flex-shrink-0 mx-auto md:mx-0">
                          <div className="h-40 w-40 rounded-3xl bg-white p-4 shadow-2xl ring-4 ring-primary/10">
                            <img 
                              src={aiAssets.logo_base64} 
                              alt="AI Generated Logo" 
                              className="w-full h-full object-contain"
                            />
                            <div className="mt-2 text-[10px] text-center text-muted-foreground font-mono uppercase tracking-tighter">
                              AI Generated Logo
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex-1 prose prose-invert max-w-none">
                         <div className="bg-secondary/20 rounded-2xl p-6 border border-border/50">
                            <div className="markdown-content text-sm leading-relaxed text-foreground/90">
                              <ReactMarkdown>
                                {aiAssets.business_plan || ""}
                              </ReactMarkdown>
                            </div>
                         </div>
                      </div>
                    </div>

                    {/* Mermaid Diagram */}
                    {aiAssets.mermaid_diagram && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                          <ExternalLink className="h-4 w-4 text-primary" />
                          System Architecture Diagram
                        </h3>
                        <div className="bg-slate-900/50 rounded-2xl p-6 border border-border/50 overflow-hidden">
                           <Mermaid chart={aiAssets.mermaid_diagram} />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Founder Card */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="font-display font-semibold mb-4">About the Founder</h3>
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={project.founder.avatar}
                  alt={project.founder.name}
                  className="h-12 w-12 rounded-full ring-2 ring-border"
                />
                <div>
                  <p className="font-medium">{project.founder.name}</p>
                  {project.founder.github && (
                    <a
                      href={project.founder.github.includes('http') ? project.founder.github : `https://github.com/${project.founder.github}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      @{project.founder.github.split('/').pop()}
                    </a>
                  )}
                </div>
              </div>
              {project.founder.bio && (
               <p className="text-sm text-muted-foreground border-t border-border/50 pt-3 mt-3">
                  {project.founder.bio}
                </p>
              )}
            </div>

            {/* AI Analysis Sidebar Box */}
            {aiScore && (
              <div className={`glass-card rounded-2xl p-6 border-primary/30 bg-primary/5 transition-all duration-1000 ${isDemoMode ? 'border-dashed' : 'glow-effect'}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display font-semibold flex items-center gap-2 text-primary">
                    <Sparkles className="h-4 w-4" />
                    AI Success Analysis
                  </h3>
                  {isDemoMode && <Badge variant="outline" className="text-[8px] h-4 px-1 opacity-50">Preview</Badge>}
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed mb-4 italic">
                  "{aiScore.analysis}"
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-muted-foreground uppercase">Probability</span>
                    <span className="font-bold">{aiScore.score}%</span>
                  </div>
                  <div className="w-full bg-secondary/50 rounded-full h-2.5 overflow-hidden border border-border/30">
                    <div 
                      className="bg-primary-gradient h-full transition-all duration-[2000ms] ease-out shadow-[0_0_10px_rgba(245,158,11,0.5)]" 
                      style={{ width: `${aiScore.score}%` }}
                    />
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-4 uppercase tracking-[0.2em] font-bold opacity-70">
                  Vichaar Setu Intelligence
                </p>
              </div>
            )}

            {/* Discussion */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Discussion
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Join the conversation and share your thoughts.
              </p>
              <Button variant="secondary" className="w-full">
                Start Discussion
              </Button>
            </div>
          </div>
        </div>

        {/* Related Startups */}
        {relatedProjects.length > 0 && (
          <section className="mt-16 pt-12 border-t border-border/50">
            <h2 className="font-display text-2xl font-bold mb-6">
              More in {project.category}
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {relatedProjects.map((related) => (
                <StartupCard
                  key={related.id}
                  id={related.id}
                  name={related.name}
                  tagline={related.tagline}
                  logo={related.logo}
                  category={related.category}
                  upvotes={related.upvotes}
                  founder={{
                    name: related.founder.name,
                    avatar: related.founder.avatar,
                  }}
                  onUpvote={() => handleUpvote(related.id)}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
};

export default StartupDetail;
