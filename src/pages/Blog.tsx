import { useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, ArrowRight, User, BookOpen, TrendingUp } from "lucide-react";

const blogPosts = [
  {
    id: 1,
    title: "How to Pitch Your Startup Idea to Investors",
    excerpt: "Learn the essential elements of a compelling pitch that captures investor attention and communicates your vision effectively. We break down what actually works.",
    author: "Priya Sharma",
    date: "Dec 28, 2025",
    readTime: "5 min read",
    category: "Tips & Guides",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&auto=format&fit=crop",
    featured: true
  },
  {
    id: 2,
    title: "Student Entrepreneurs Who Changed the World",
    excerpt: "From dorm rooms to billion-dollar companies — inspiring stories of founders who started just like you.",
    author: "Rahul Verma",
    date: "Dec 25, 2025",
    readTime: "8 min read",
    category: "Inspiration",
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop"
  },
  {
    id: 3,
    title: "Building Your First MVP: A No-BS Guide",
    excerpt: "Skip the fluff. Here's exactly how to build your minimum viable product without burning out or breaking the bank.",
    author: "Ananya Gupta",
    date: "Dec 22, 2025",
    readTime: "10 min read",
    category: "Development",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop"
  },
  {
    id: 4,
    title: "The Art of Networking (Without Being Awkward)",
    excerpt: "Real talk about building genuine connections that actually help your startup journey. No fake smiles required.",
    author: "Vikram Singh",
    date: "Dec 18, 2025",
    readTime: "6 min read",
    category: "Networking",
    image: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&auto=format&fit=crop"
  },
  {
    id: 5,
    title: "Funding Options for Student Startups in India",
    excerpt: "Grants, angels, VCs, or bootstrapping? We break down every option and help you pick what's right for your stage.",
    author: "Meera Patel",
    date: "Dec 15, 2025",
    readTime: "7 min read",
    category: "Funding",
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&auto=format&fit=crop"
  },
  {
    id: 6,
    title: "Balancing Studies and Startup Life",
    excerpt: "Yes, you can do both. Here's how real student founders manage their time without losing their minds.",
    author: "Arjun Mehta",
    date: "Dec 10, 2025",
    readTime: "5 min read",
    category: "Lifestyle",
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop"
  }
];

const categories = ["All", "Tips & Guides", "Inspiration", "Development", "Networking", "Funding", "Lifestyle"];

const Blog = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const featuredPost = blogPosts.find(post => post.featured);
  const otherPosts = blogPosts.filter(post => !post.featured);

  return (
    <Layout>
      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="py-20 md:py-28 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-secondary/5" />
          <div className="absolute top-20 right-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
          
          <div className="container relative">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                <BookOpen className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">The Vichaar Setu Blog</span>
              </div>
              
              <h1 className="font-display text-5xl md:text-7xl font-bold mb-6 leading-tight">
                Stories, Tips & <br />
                <span className="text-gradient">Real Talk</span>
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-xl">
                No jargon. No fluff. Just honest insights from founders, 
                investors, and the Vichaar Setu team.
              </p>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-6 border-b border-border/30 sticky top-16 bg-background/80 backdrop-blur-lg z-10">
          <div className="container">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map((category) => (
                <button
                  key={category}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    category === "All" 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Post */}
        {featuredPost && (
          <section className="py-12">
            <div className="container">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span className="font-semibold text-primary">Featured Story</span>
              </div>
              
              <article className="group relative rounded-3xl overflow-hidden bg-card border border-border/50 hover:border-primary/30 transition-all duration-300">
                <div className="grid lg:grid-cols-2 gap-0">
                  <div className="aspect-[4/3] lg:aspect-auto overflow-hidden">
                    <img 
                      src={featuredPost.image} 
                      alt={featuredPost.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                  <div className="p-8 lg:p-12 flex flex-col justify-center">
                    <Badge variant="secondary" className="w-fit mb-4">{featuredPost.category}</Badge>
                    <h2 className="font-display text-3xl lg:text-4xl font-bold mb-4 group-hover:text-primary transition-colors">
                      {featuredPost.title}
                    </h2>
                    <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                      {featuredPost.excerpt}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8">
                      <span className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        {featuredPost.author}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {featuredPost.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {featuredPost.readTime}
                      </span>
                    </div>
                    <Button className="w-fit gap-2 group/btn">
                      Read Full Story 
                      <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </div>
              </article>
            </div>
          </section>
        )}

        {/* Blog Grid */}
        <section className="py-16">
          <div className="container">
            <h2 className="font-display text-2xl font-bold mb-10">Latest Articles</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {otherPosts.map((post) => (
                <article 
                  key={post.id}
                  className="group flex flex-col rounded-2xl overflow-hidden bg-card border border-border/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
                >
                  <div className="aspect-[16/10] overflow-hidden">
                    <img 
                      src={post.image} 
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="flex-1 p-6 flex flex-col">
                    <Badge variant="secondary" className="w-fit mb-4 text-xs">{post.category}</Badge>
                    <h3 className="font-display text-xl font-semibold mb-3 group-hover:text-primary transition-colors leading-tight">
                      {post.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6 leading-relaxed flex-1">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border/50">
                      <span className="font-medium">{post.author}</span>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {post.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {post.readTime}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            
            <div className="text-center mt-12">
              <Button variant="outline" size="lg" className="gap-2">
                Load More Articles <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="py-20 bg-gradient-to-b from-card/50 to-transparent border-t border-border/30">
          <div className="container">
            <div className="max-w-2xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                <span className="text-sm font-medium text-primary">Join 2,000+ founders</span>
              </div>
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
                Get smarter about startups
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Weekly insights, founder stories, and practical tips. No spam, unsubscribe anytime.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input 
                  type="email" 
                  placeholder="you@example.com"
                  className="flex-1 px-5 py-3.5 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
                />
                <Button size="lg" className="px-8">Subscribe</Button>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                We respect your inbox. Read our privacy policy.
              </p>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Blog;