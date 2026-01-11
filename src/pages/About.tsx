import { useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Users, Target, Lightbulb, Heart, ArrowRight, Sparkles, Globe, Zap } from "lucide-react";
import logo from "@/assets/logo.png";

const About = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <Layout>
      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="py-24 md:py-36 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-secondary/5" />
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-secondary/8 rounded-full blur-3xl" />
          
          <div className="container relative">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Building the future of student innovation</span>
              </div>
              
              <h1 className="font-display text-5xl md:text-7xl font-bold mb-8 leading-tight">
                Where Ideas Find <br />
                <span className="text-gradient">Their Wings</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                Vichaar Setu — meaning "Bridge of Ideas" in Hindi — connects ambitious student 
                innovators with investors who believe in fresh perspectives.
              </p>
            </div>
          </div>
        </section>

        {/* Story Section */}
        <section className="py-20 border-t border-border/30">
          <div className="container">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <span className="text-sm font-semibold text-primary uppercase tracking-wider">Our Story</span>
                <h2 className="font-display text-4xl md:text-5xl font-bold mt-4 mb-8">
                  Started by students, <br />for students
                </h2>
                <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
                  <p>
                    We've seen too many brilliant ideas die in dorm rooms — not because they weren't good enough, 
                    but because students didn't know where to start or who to talk to.
                  </p>
                  <p>
                    That's why we built Vichaar Setu. A place where your idea isn't judged by your experience 
                    or connections, but by its potential to solve real problems.
                  </p>
                  <p>
                    Every great company started as a spark in someone's mind. We're here to help 
                    you fan that spark into a flame.
                  </p>
                </div>
              </div>
              
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-3xl blur-2xl" />
                <div className="relative bg-card border border-border/50 rounded-3xl p-8 md:p-12">
                  <img 
                    src={logo} 
                    alt="Vichaar Setu" 
                    className="h-20 w-20 object-contain rounded-2xl mb-8"
                  />
                  <blockquote className="text-2xl font-display font-medium mb-6 leading-relaxed">
                    "The best time to start was yesterday. The second best time is now."
                  </blockquote>
                  <p className="text-muted-foreground">
                    — The philosophy behind everything we do
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* What We Believe Section */}
        <section className="py-20 bg-gradient-to-b from-card/50 to-transparent">
          <div className="container">
            <div className="text-center mb-16">
              <span className="text-sm font-semibold text-primary uppercase tracking-wider">What We Believe</span>
              <h2 className="font-display text-4xl md:text-5xl font-bold mt-4">
                Ideas don't care about your resume
              </h2>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="group p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Target className="h-7 w-7 text-orange-500" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-3">Bold Vision</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Dream big, start small, but always start. The boldest ideas come from those who refuse to accept "that's just how it is."
                </p>
              </div>
              
              <div className="group p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Lightbulb className="h-7 w-7 text-blue-500" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-3">Pure Innovation</h3>
                <p className="text-muted-foreground leading-relaxed">
                  The freshest perspectives come from those unburdened by "industry norms." Question everything.
                </p>
              </div>
              
              <div className="group p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Users className="h-7 w-7 text-green-500" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-3">Real Community</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Not just a platform — a network of founders, mentors, and believers who lift each other up.
                </p>
              </div>
              
              <div className="group p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Heart className="h-7 w-7 text-pink-500" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-3">Genuine Support</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We celebrate your wins and help you navigate the tough times. Because building is hard.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Numbers Section */}
        <section className="py-20">
          <div className="container">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div className="p-8">
                <div className="text-6xl font-display font-bold text-gradient mb-3">500+</div>
                <p className="text-lg text-muted-foreground">Student Projects Launched</p>
              </div>
              <div className="p-8">
                <div className="text-6xl font-display font-bold text-gradient mb-3">₹2Cr+</div>
                <p className="text-lg text-muted-foreground">Funding Facilitated</p>
              </div>
              <div className="p-8">
                <div className="text-6xl font-display font-bold text-gradient mb-3">50+</div>
                <p className="text-lg text-muted-foreground">Active Investors</p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 bg-card/30 border-y border-border/30">
          <div className="container">
            <div className="text-center mb-16">
              <span className="text-sm font-semibold text-primary uppercase tracking-wider">How It Works</span>
              <h2 className="font-display text-4xl md:text-5xl font-bold mt-4">
                Simple as 1, 2, 3
              </h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="relative text-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl font-display font-bold text-primary">1</span>
                </div>
                <h3 className="font-display text-xl font-semibold mb-3">Share Your Idea</h3>
                <p className="text-muted-foreground">
                  Create a profile, describe your project, and tell us what problem you're solving.
                </p>
                <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
              </div>
              
              <div className="relative text-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl font-display font-bold text-primary">2</span>
                </div>
                <h3 className="font-display text-xl font-semibold mb-3">Get Discovered</h3>
                <p className="text-muted-foreground">
                  Investors browse projects and reach out to founders they believe in.
                </p>
                <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
              </div>
              
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl font-display font-bold text-primary">3</span>
                </div>
                <h3 className="font-display text-xl font-semibold mb-3">Build Together</h3>
                <p className="text-muted-foreground">
                  Connect, discuss, and turn your vision into reality with the right support.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24">
          <div className="container">
            <div className="relative max-w-4xl mx-auto">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 rounded-3xl blur-2xl" />
              <div className="relative bg-card border border-border/50 rounded-3xl p-12 md:p-16 text-center">
                <Zap className="h-12 w-12 text-primary mx-auto mb-6" />
                <h2 className="font-display text-3xl md:text-5xl font-bold mb-6">
                  Ready to build something amazing?
                </h2>
                <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                  Whether you're a student with a groundbreaking idea or an investor looking for the next big thing — your journey starts here.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild size="lg" className="gap-2 px-8">
                    <Link to="/auth">
                      Start Your Journey <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="px-8">
                    <Link to="/explore">Browse Projects</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default About;