import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles, Loader2, ArrowLeft, Lightbulb, Rocket, ChevronRight, Brain } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import AnimatedBackground from "@/components/ui/AnimatedBackground";
import { useAuth } from "@/contexts/AuthContext";

type Idea = {
  title: string;
  tagline: string;
  description: string;
  problem: string;
  solution: string;
  tech_stack: string[];
  category: string;
};

const Ideate = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please tell us what you're interested in first!");
      return;
    }

    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

    setLoading(true);
    setErrorMsg("");
    setIdeas([]);

    try {
      const response = await fetch(`${apiUrl}/api/generate-idea`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        let errorData = await response.text();
        try {
          const parsedError = JSON.parse(errorData);
          errorData = parsedError.error;
        } catch(e) {}
        throw new Error(errorData || "Failed to fetch from backend");
      }

      const data = await response.json();
      
      if (data.ideas && Array.isArray(data.ideas)) {
        setIdeas(data.ideas);
        toast.success("Generated amazing ideas for you!");
      } else {
        throw new Error("Invalid format received from backend");
      }
    } catch (error: any) {
      console.error("AI Generation failed:", error);
      setErrorMsg(error.message || "Failed to connect to the AI model.");
    } finally {
      setLoading(false);
    }
  };

  const startBuilding = (idea: Idea) => {
    if (!user) {
      toast.info("Please sign in as a student to create this project!");
      navigate("/auth?mode=sign-up");
      return;
    }
    // We could pass the idea data via state or session storage to pre-fill 
    // the submit/dashboard form. To keep it simple, let's navigate to Student Dashboard 
    // where they can create the project. 
    // Advanced: Pre-fill by saving to sessionStorage
    sessionStorage.setItem("vichaar_ai_idea", JSON.stringify(idea));
    navigate("/student-dashboard", { state: { openNewProject: true } });
    toast.success("Great choice! Project details copied to your dashboard.");
  };

  return (
    <Layout>
      <AnimatedBackground />
      <div className="container min-h-screen py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
                <Brain className="h-8 w-8 text-primary" />
              </div>
              <h1 className="font-display text-4xl font-bold">AI Idea Generator</h1>
            </div>
            <p className="text-xl text-muted-foreground">
              Not sure what to build? Describe your interests, skills, or a problem you want to solve, and let AI brainstorm the perfect startup project for you.
            </p>
          </div>

          {/* Input Section */}
          <Card className="glass-card p-6 md:p-8 mb-12 shadow-2xl border-primary/20">
            <div className="space-y-4">
              <label htmlFor="prompt" className="text-sm font-medium flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-accent" />
                What are you passionate about?
              </label>
              <Textarea
                id="prompt"
                placeholder="e.g. I know React and Python. I love education and want to help students study better using AI."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[120px] text-lg bg-background/50 border-border/50 resize-y"
              />
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-center sm:items-start pt-2">
                <div className="text-sm text-muted-foreground w-full sm:w-2/3">
                  {errorMsg && <p className="text-destructive font-medium">{errorMsg}</p>}
                </div>
                <Button 
                  onClick={handleGenerate} 
                  disabled={loading || !prompt.trim()}
                  size="lg"
                  className="w-full sm:w-auto bg-primary-gradient hover:opacity-90 font-semibold"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Brainstorming...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Generate Ideas
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>

          {/* Results Section */}
          {ideas.length > 0 && (
            <div className="space-y-8 animate-fade-up">
              <h2 className="font-display text-2xl font-bold flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                Your Custom Startup Ideas
              </h2>
              <div className="grid gap-6">
                {ideas.map((idea, index) => (
                  <Card key={index} className="glass-card p-6 md:p-8 hover:border-primary/30 transition-all group overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                    
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                      <div className="flex-1 space-y-4">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-display text-2xl font-bold">{idea.title}</h3>
                              <Badge variant="secondary" className="bg-secondary/50">{idea.category}</Badge>
                            </div>
                            <p className="text-lg text-primary/80 font-medium">{idea.tagline}</p>
                          </div>
                        </div>

                        <p className="text-muted-foreground leading-relaxed">{idea.description}</p>
                        
                        <div className="grid sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-border/40">
                          <div>
                            <h4 className="flex items-center gap-2 text-sm font-semibold mb-2 text-destructive/80">
                              <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                              The Problem
                            </h4>
                            <p className="text-sm text-muted-foreground">{idea.problem}</p>
                          </div>
                          <div>
                            <h4 className="flex items-center gap-2 text-sm font-semibold mb-2 text-emerald-500/80">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              The Solution
                            </h4>
                            <p className="text-sm text-muted-foreground">{idea.solution}</p>
                          </div>
                        </div>

                        <div className="pt-4 flex flex-wrap gap-2">
                          {idea.tech_stack.map((tech) => (
                            <Badge key={tech} variant="outline" className="bg-background/50 text-xs">
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="w-full md:w-auto flex-shrink-0 flex md:flex-col md:items-end md:justify-center pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-border/40 md:pl-6 mt-2 md:mt-0">
                        <Button 
                          onClick={() => startBuilding(idea)}
                          size="lg"
                          className="w-full group/btn"
                        >
                          <Rocket className="mr-2 h-4 w-4 transition-transform group-hover/btn:-translate-y-1 group-hover/btn:translate-x-1" />
                          Build This
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Ideate;
