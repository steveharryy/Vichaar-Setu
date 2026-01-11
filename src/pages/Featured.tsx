import { Trophy, Star } from "lucide-react";
import Layout from "@/components/layout/Layout";
import StartupCard from "@/components/startup/StartupCard";
import { getFeaturedStartups } from "@/data/mockData";

const Featured = () => {
  const featuredStartups = getFeaturedStartups();

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
          <div className="grid md:grid-cols-2 gap-6">
            {featuredStartups.map((startup, index) => (
              <div
                key={startup.id}
                className="animate-fade-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <StartupCard
                  id={startup.id}
                  name={startup.name}
                  tagline={startup.tagline}
                  logo={startup.logo}
                  category={startup.category}
                  upvotes={startup.upvotes}
                  isFeatured={startup.isFeatured}
                  founder={{
                    name: startup.founder.name,
                    avatar: startup.founder.avatar,
                  }}
                />
              </div>
            ))}
          </div>

          {featuredStartups.length === 0 && (
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
