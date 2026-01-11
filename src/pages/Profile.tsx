import { Link } from "react-router-dom";
import { Github, MapPin, Calendar, ExternalLink, Settings } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import StartupCard from "@/components/startup/StartupCard";
import { startups } from "@/data/mockData";

const Profile = () => {
  // Mock user data (would come from auth/database)
  const user = {
    id: "u1",
    name: "Sarah Chen",
    username: "sarahchen",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
    bio: "Former Google engineer. Building AI tools for the future of work. Passionate about developer experience and open source.",
    location: "San Francisco, CA",
    github: "sarahchen",
    joinedAt: "January 2024",
    website: "https://sarahchen.dev",
  };

  const userStartups = startups.filter((s) => s.founder.id === user.id);
  const totalUpvotes = userStartups.reduce((sum, s) => sum + s.upvotes, 0);

  return (
    <Layout>
      <div className="min-h-screen">
        {/* Profile Header */}
        <section className="border-b border-border/50 bg-card/30">
          <div className="container py-12">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Avatar */}
              <div className="relative">
                <div className="h-28 w-28 md:h-36 md:w-36 rounded-2xl bg-secondary overflow-hidden ring-4 ring-border/50 shadow-soft">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div>
                    <h1 className="font-display text-3xl font-bold mb-1">
                      {user.name}
                    </h1>
                    <p className="text-muted-foreground">@{user.username}</p>
                  </div>
                  <Button variant="outline" className="gap-2 w-fit">
                    <Settings className="h-4 w-4" />
                    Edit Profile
                  </Button>
                </div>

                <p className="mt-4 text-muted-foreground max-w-xl">
                  {user.bio}
                </p>

                {/* Meta */}
                <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
                  {user.location && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" />
                      {user.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    Joined {user.joinedAt}
                  </span>
                  {user.github && (
                    <a
                      href={`https://github.com/${user.github}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                    >
                      <Github className="h-4 w-4" />
                      @{user.github}
                    </a>
                  )}
                  {user.website && (
                    <a
                      href={user.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Website
                    </a>
                  )}
                </div>

                {/* Stats */}
                <div className="flex gap-8 mt-6 pt-6 border-t border-border/50">
                  <div>
                    <div className="font-display text-2xl font-bold">
                      {userStartups.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Startups</div>
                  </div>
                  <div>
                    <div className="font-display text-2xl font-bold">
                      {totalUpvotes}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Upvotes</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Startups */}
        <section className="container py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl font-bold">My Startups</h2>
            <Button asChild>
              <Link to="/submit">Submit New</Link>
            </Button>
          </div>

          {userStartups.length > 0 ? (
            <div className="space-y-4">
              {userStartups.map((startup) => (
                <StartupCard
                  key={startup.id}
                  id={startup.id}
                  name={startup.name}
                  tagline={startup.tagline}
                  logo={startup.logo}
                  category={startup.category}
                  upvotes={startup.upvotes}
                  isFeatured={startup.isFeatured}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 glass-card rounded-2xl">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-secondary flex items-center justify-center">
                <Rocket className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">
                No startups yet
              </h3>
              <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                Ready to share your idea with the world? Submit your first startup!
              </p>
              <Button variant="hero" asChild>
                <Link to="/submit">Submit Your First Startup</Link>
              </Button>
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
};

// Add missing import
import { Rocket } from "lucide-react";

export default Profile;
