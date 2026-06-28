import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Sparkles, ChevronRight } from "lucide-react";
import Layout from "@/components/layout/Layout";

import AnimatedBackground from "@/components/ui/AnimatedBackground";
import StartupCard from "@/components/startup/StartupCard";
import CategoryBadge from "@/components/startup/CategoryBadge";
import { categories } from "@/data/mockData";
import { useQuery } from "@tanstack/react-query";
import { getAllPublishedProjects, upvoteProject, getUserUpvotes } from "@/lib/supabase-db";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useState, useEffect } from "react";

const Index = () => {
  const { data: projects, refetch } = useQuery({
    queryKey: ['publishedProjects-index'],
    queryFn: getAllPublishedProjects,
  });

  const { user } = useAuth();
  const [upvotedProjectIds, setUpvotedProjectIds] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      getUserUpvotes(user.id).then(setUpvotedProjectIds).catch(console.error);
    }
  }, [user]);

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
      setUpvotedProjectIds(prev => [...prev, projectId]);
      refetch(); // Refresh counts on index
      toast.success("Project upvoted!");
    } catch (error) {
      console.error("Error upvoting project:", error);
      toast.error("Failed to upvote");
    }
  };

  const featuredStartups = projects ? projects.slice(0, 3) : [];
  const trendingStartups = projects ? [...projects].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 4) : [];

  return (
    <Layout>
      <AnimatedBackground />
      
      {/* Hero Section - Asymmetric, editorial layout */}
      <section className="relative min-h-[90vh] flex items-center">
        <div className="container">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left content */}
            <div className="lg:col-span-7 space-y-8">
              {/* Label */}
              <div className="animate-fade-up">
                <span className="label-mono">Student Startup Platform</span>
              </div>

              {/* Main headline - distinctive typography */}
              <h1 className="animate-fade-up stagger-1">
                <span className="block font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-[0.95] tracking-tight">
                  Where ideas
                </span>
                <span className="block font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-[0.95] tracking-tight mt-2">
                  become <span className="gradient-text">ventures</span>
                </span>
              </h1>

              {/* Subtext */}
              <p className="text-lg md:text-xl text-muted-foreground max-w-lg leading-relaxed animate-fade-up stagger-2">
                Students pitch. Investors discover. 
                The next generation of startups starts here.
              </p>

              {/* CTA */}
              <div className="flex flex-wrap gap-3 animate-fade-up stagger-3">
                <Button 
                  size="lg" 
                  asChild
                  className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6 h-12 text-base group"
                >
                  <Link to="/ideate" className="gap-2">
                    Start Building
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  asChild
                  className="rounded-full px-6 h-12 text-base border-border/60 hover:bg-secondary/50"
                >
                  <Link to="/explore">Explore Projects</Link>
                </Button>
              </div>
            </div>

            {/* Right side - Stats cards */}
            <div className="lg:col-span-5">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { number: projects ? projects.length : 0, label: "Active Projects", delay: "stagger-2" },
                  { number: "340+", label: "Investors", delay: "stagger-3" },
                  { number: "$2.1M", label: "Funding Raised", delay: "stagger-4" },
                  { number: "89%", label: "Success Rate", delay: "stagger-5" },
                ].map((stat) => (
                  <div 
                    key={stat.label}
                    className={`glass-card p-6 animate-fade-up ${stat.delay}`}
                  >
                    <div className="display-number gradient-text">{stat.number}</div>
                    <div className="label-mono mt-2">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Section - Editorial grid */}
      <section className="py-24 relative">
        <div className="container">
          {/* Section header */}
          <div className="flex items-end justify-between mb-12 animate-fade-up">
            <div>
              <span className="label-mono">Handpicked</span>
              <h2 className="font-display text-3xl md:text-4xl font-bold mt-3">
                Editor's Picks
              </h2>
            </div>
            <Link 
              to="/featured" 
              className="hidden sm:flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
            >
              View all
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* Featured grid - asymmetric */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredStartups.map((startup, index) => (
              <div
                key={startup.id}
                className={`animate-fade-up ${index === 0 ? 'md:col-span-2 lg:col-span-1' : ''}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <Link to={`/startup/${startup.id}`}>
                  <StartupCard
                    id={startup.id}
                    name={startup.title}
                    tagline={startup.tagline || ""}
                    logo={startup.logo_url || "https://api.dicebear.com/7.x/shapes/svg?seed=" + startup.title}
                    category={startup.category || "Other"}
                    upvotes={startup.upvotes || 0}
                    isUpvoted={upvotedProjectIds.includes(startup.id)}
                    onUpvote={() => handleUpvote(startup.id)}
                    isFeatured={true}
                    founder={{
                      name: startup.founder_name || "Unknown",
                      avatar: startup.founder_avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + startup.founder_name,
                    }}
                  />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trending Section */}
      <section className="py-24 bg-secondary/20 relative">
        <div className="container">
          <div className="grid lg:grid-cols-12 gap-12 items-start">
            {/* Left side - Intro */}
            <div className="lg:col-span-4 lg:sticky lg:top-24">
              <span className="label-mono">This Week</span>
              <h2 className="font-display text-3xl md:text-4xl font-bold mt-3 mb-4">
                Trending<br />Projects
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                The most upvoted projects from our community this week. 
                Real builders, real products.
              </p>
              <div className="highlight-bar" />
            </div>

            {/* Right side - Projects list */}
            <div className="lg:col-span-8 space-y-4">
              {trendingStartups.map((startup, index) => (
                <div
                  key={startup.id}
                  className="animate-fade-up"
                  style={{ animationDelay: `${index * 0.08}s` }}
                >
                  <Link to={`/startup/${startup.id}`}>
                    <StartupCard
                      id={startup.id}
                      name={startup.title}
                      tagline={startup.tagline || ""}
                      logo={startup.logo_url || "https://api.dicebear.com/7.x/shapes/svg?seed=" + startup.title}
                      category={startup.category || "Other"}
                      upvotes={startup.upvotes || 0}
                      isUpvoted={upvotedProjectIds.includes(startup.id)}
                      onUpvote={() => handleUpvote(startup.id)}
                      isFeatured={false}
                      founder={{
                        name: startup.founder_name || "Unknown",
                        avatar: startup.founder_avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + startup.founder_name,
                      }}
                    />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Categories - Horizontal scroll on mobile */}
      <section className="py-24">
        <div className="container">
          <div className="text-center mb-12">
            <span className="label-mono">Browse by</span>
            <h2 className="font-display text-3xl md:text-4xl font-bold mt-3">
              Categories
            </h2>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((category, i) => {
              const dynamicCount = projects ? projects.filter(p => p.category === category.name).length : 0;
              return (
                <Link 
                  key={category.id} 
                  to={`/categories/${category.slug}`}
                  className="animate-fade-up"
                  style={{ animationDelay: `${i * 0.03}s` }}
                >
                  <CategoryBadge
                    name={category.name}
                    count={dynamicCount}
                  />
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section - Minimal, impactful */}
      <section className="py-32">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-fade-up">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Free to join</span>
            </div>
            
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 animate-fade-up stagger-1">
              Ready to build<br />something great?
            </h2>
            
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10 animate-fade-up stagger-2">
              Whether you're a student with a vision or an investor looking for the next big thing.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up stagger-3">
              <Button
                size="lg"
                asChild
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 h-14 text-base group"
              >
                <Link to="/auth" className="gap-2">
                  Join as Student
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="rounded-full px-8 h-14 text-base border-border/60 hover:bg-secondary/50"
              >
                <Link to="/auth">Join as Investor</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;