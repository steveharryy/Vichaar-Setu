import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import Layout from "@/components/layout/Layout";
import StartupCard from "@/components/startup/StartupCard";
import StartupCardSkeleton from "@/components/startup/StartupCardSkeleton";
import CategoryBadge from "@/components/startup/CategoryBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAllPublishedProjects, type Project, upvoteProject, getUserUpvotes } from "@/lib/supabase-db";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const categoryConfig = [
  { slug: "ai-ml", name: "AI & ML", dbCategory: "AI & ML" },
  { slug: "saas", name: "SaaS", dbCategory: "SaaS" },
  { slug: "developer-tools", name: "Developer Tools", dbCategory: "Developer Tools" },
  { slug: "fintech", name: "Fintech", dbCategory: "Fintech" },
  { slug: "health-wellness", name: "Health & Wellness", dbCategory: "Health & Wellness" },
  { slug: "ecommerce", name: "E-commerce", dbCategory: "E-commerce" },
  { slug: "productivity", name: "Productivity", dbCategory: "Productivity" },
  { slug: "education", name: "Education", dbCategory: "Education" },
];

const Explore = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"newest" | "popular">("newest");

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [upvotedProjectIds, setUpvotedProjectIds] = useState<string[]>([]);

  // Initial fetch
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
        console.error("Failed to load projects:", e);
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
      .channel("projects-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "projects" },
        (payload) => {
          console.log("Realtime update:", payload);
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

  // Get category counts
  const getCategoryCount = (dbCategory: string) => {
    return projects.filter((p) => p.category === dbCategory).length;
  };

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const selectedDbCategory = categoryConfig.find((c) => c.slug === selectedCategory)?.dbCategory;

    return projects
      .filter((project) => {
        const matchesSearch =
          !q ||
          project.title.toLowerCase().includes(q) ||
          (project.tagline || "").toLowerCase().includes(q) ||
          (project.tech_stack || []).some((t) => t.toLowerCase().includes(q));

        const matchesCategory = !selectedDbCategory || project.category === selectedDbCategory;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        if (sortBy === "newest") {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        // No upvotes in DB yet; keep stable order for "popular".
        return 0;
      });
  }, [projects, searchQuery, selectedCategory, sortBy]);

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
        <section className="border-b border-border/50 bg-card/30">
          <div className="container py-8">
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
              Explore Startups
            </h1>
            <p className="text-muted-foreground">
              Discover {projects.length}+ innovative startups building the future
            </p>
          </div>
        </section>

        <div className="container py-8">
          {/* Search & Filters */}
          <div className="flex flex-col lg:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search startups, categories, tech stacks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-base bg-card border-border/50"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={sortBy === "newest" ? "secondary" : "ghost"}
                onClick={() => setSortBy("newest")}
                className="gap-2"
              >
                Newest
              </Button>
              <Button
                variant={sortBy === "popular" ? "secondary" : "ghost"}
                onClick={() => setSortBy("popular")}
                className="gap-2"
              >
                Popular
              </Button>
            </div>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-2 mb-8">
            <CategoryBadge
              name="All"
              isActive={selectedCategory === null}
              onClick={() => setSelectedCategory(null)}
            />
            {categoryConfig.map((category) => (
              <CategoryBadge
                key={category.slug}
                name={category.name}
                count={getCategoryCount(category.dbCategory)}
                isActive={selectedCategory === category.slug}
                onClick={() => setSelectedCategory(category.slug)}
              />
            ))}
          </div>

          {/* Results */}
          <div className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <StartupCardSkeleton key={i} />
                ))}
              </div>
            ) : filteredProjects.length > 0 ? (
              filteredProjects.map((project, index) => (
                <div
                  key={project.id}
                  className="animate-fade-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <StartupCard
                    id={project.id}
                    name={project.title}
                    tagline={project.tagline || ""}
                    logo={project.logo_url || "/placeholder.svg"}
                    category={project.category || "Uncategorized"}
                    upvotes={project.upvotes || 0}
                    isUpvoted={upvotedProjectIds.includes(project.id)}
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
              ))
            ) : (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-secondary flex items-center justify-center">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">
                  No startups found
                </h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  Try adjusting your search or filters to find what you're looking for.
                </p>
                <Button
                  variant="outline"
                  className="mt-6"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory(null);
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Explore;
