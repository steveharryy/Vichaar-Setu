import { useEffect, useState } from "react";
import { Trophy, Star } from "lucide-react";
import Layout from "@/components/layout/Layout";
import StartupCard from "@/components/startup/StartupCard";
import StartupCardSkeleton from "@/components/startup/StartupCardSkeleton";
import { getAllPublishedProjects, type Project, upvoteProject, getUserUpvotes } from "@/lib/supabase-db";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const Featured = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [upvotedProjectIds, setUpvotedProjectIds] = useState<string[]>([]);

  // Fetch all published projects (featured = all projects for now)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await getAllPublishedProjects();
        if (!cancelled) setProjects(data);

        // Fetch user's upvotes if logged in
        if (user) {
          const ids = await getUserUpvotes(user.id);
          if (!cancelled) setUpvotedProjectIds(ids);
        }
      } catch (e) {
        console.error("Failed to load featured projects:", e);
        if (!cancelled) setProjects([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Realtime subscription for instant updates
  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel("featured-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "projects" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newProject = payload.new as Project;
            if (newProject.status === "published") {
              setProjects((prev) => [newProject, ...prev]);
            }
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as Project;
            setProjects((prev) =>
              prev
                .map((p) => (p.id === updated.id ? updated : p))
                .filter((p) => p.status === "published")
            );
          } else if (payload.eventType === "DELETE") {
            const deleted = payload.old as { id: string };
            setProjects((prev) => prev.filter((p) => p.id !== deleted.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleUpvote = async (projectId: string) => {
    if (!user) {
      toast.error("Please login to upvote");
      return;
    }
    
    if (upvotedProjectIds.includes(projectId)) {
      toast.info("You have already upvoted this project");
      return;
    }

    try {
      const newCount = await upvoteProject(projectId, user.id);
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, upvotes: newCount } : p));
      setUpvotedProjectIds(prev => [...prev, projectId]);
      toast.success("Project upvoted!");
    } catch (error) {
      console.error("Error upvoting project:", error);
      toast.error("Failed to upvote");
    }
  };

  return (
    <Layout>
      <div className="min-h-screen">
        {/* Header */}
        <section className="border-b border-border/50 bg-primary-gradient text-primary-foreground">
          <div className="container py-16 text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary-foreground/20 backdrop-blur-sm mb-6">
              <Trophy className="h-8 w-8" />
            </div>
            <h1 className="font-display text-3xl md:text-5xl font-bold mb-4">
              Editor's Picks
            </h1>
            <p className="text-lg text-primary-foreground/80 max-w-xl mx-auto">
              Hand-picked by our team — the most innovative and promising startups on IdeaForge.
            </p>
          </div>
        </section>

        {/* Featured List */}
        <section className="container py-12">
          {loading ? (
            <div className="grid md:grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <StartupCardSkeleton key={i} />
              ))}
            </div>
          ) : projects.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {projects.map((project, index) => (
                <div
                  key={project.id}
                  className="animate-fade-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <StartupCard
                    id={project.id}
                    name={project.title}
                    tagline={project.tagline || ""}
                    logo={project.logo_url || "/placeholder.svg"}
                    category={project.category || "Uncategorized"}
                    upvotes={project.upvotes || 0}
                    isUpvoted={upvotedProjectIds.includes(project.id)}
                    isFeatured={true}
                    founder={
                      project.founder_name
                        ? {
                          name: project.founder_name,
                          avatar: project.founder_avatar || "/placeholder.svg",
                        }
                        : undefined
                    }
                    onUpvote={() => handleUpvote(project.id)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-secondary flex items-center justify-center">
                <Star className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">
                No featured startups yet
              </h3>
              <p className="text-muted-foreground">
                Check back soon for our editor's picks!
              </p>
            </div>
          )}

        </section>
      </div>
    </Layout>
  );
};

export default Featured;
