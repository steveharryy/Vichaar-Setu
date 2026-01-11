import { useState } from "react";
import { Search } from "lucide-react";
import Layout from "@/components/layout/Layout";
import StartupCard from "@/components/startup/StartupCard";
import StartupCardSkeleton from "@/components/startup/StartupCardSkeleton";
import CategoryBadge from "@/components/startup/CategoryBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { startups, categories } from "@/data/mockData";

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

  // Get category counts
  const getCategoryCount = (dbCategory: string) => {
    return startups.filter(p => p.category === dbCategory).length;
  };

  // Filter and sort projects
  const filteredProjects = startups
    .filter((project) => {
      const matchesSearch =
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.tagline.toLowerCase().includes(searchQuery.toLowerCase());
      
      const selectedDbCategory = categoryConfig.find(c => c.slug === selectedCategory)?.dbCategory;
      const matchesCategory = !selectedCategory || project.category === selectedDbCategory;
      
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === "popular") {
        return b.upvotes - a.upvotes;
      }
      return 0;
    });

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
              Discover {startups.length}+ innovative startups building the future
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
            {filteredProjects.length > 0 ? (
              filteredProjects.map((project, index) => (
                <div
                  key={project.id}
                  className="animate-fade-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <StartupCard
                    id={project.id}
                    name={project.name}
                    tagline={project.tagline}
                    logo={project.logo}
                    category={project.category}
                    upvotes={project.upvotes}
                    isFeatured={project.isFeatured}
                    founder={{
                      name: project.founder.name,
                      avatar: project.founder.avatar,
                    }}
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
