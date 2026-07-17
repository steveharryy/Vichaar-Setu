import { useState } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Sparkles, Search, SlidersHorizontal, Cpu, TrendingUp, AlertCircle,
  Briefcase, DollarSign, Database, Loader2, ArrowRight, BookOpen, Clock, Lightbulb
} from 'lucide-react';
import { ragSearch, ragReindex, RagProjectMatch, RagSearchResponse } from '@/lib/database';

const CATEGORIES = [
  'AI & ML', 'SaaS', 'FinTech', 'Health & Wellness', 'EdTech',
  'E-commerce', 'Developer Tools', 'CleanTech', 'Gaming', 'Social Impact'
];

export default function SmartSearch() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [reindexing, setReindexing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [results, setResults] = useState<RagSearchResponse | null>(null);

  // Filters
  const [category, setCategory] = useState<string>('');
  const [minFunding, setMinFunding] = useState<string>('');
  const [maxFunding, setMaxFunding] = useState<string>('');
  const [techStack, setTechStack] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      toast.error('Please enter a search query.');
      return;
    }

    setLoading(true);
    try {
      const filters = {
        category: category || undefined,
        min_funding: minFunding ? parseFloat(minFunding) : undefined,
        max_funding: maxFunding ? parseFloat(maxFunding) : undefined,
        tech_stack: techStack.trim() || undefined,
      };

      const res = await ragSearch(query, filters);
      setResults(res);
      toast.success(`Search completed with ${res.total_matches} matches!`);
    } catch (err: any) {
      console.error('Smart Search error:', err);
      toast.error(err.message || 'AI Smart Search failed. Make sure python-ai-engine is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleReindex = async () => {
    setReindexing(true);
    try {
      const res = await ragReindex();
      toast.success(res.message || 'RAG vector store reindexing complete!');
    } catch (err: any) {
      console.error('Reindexing error:', err);
      toast.error(err.message || 'Reindexing failed.');
    } finally {
      setReindexing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Search Console Card */}
      <Card className="glass-card border-primary/20 overflow-hidden relative shadow-xl">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Cpu className="w-48 h-48 text-primary" />
        </div>

        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="font-display text-2xl font-bold bg-primary-gradient bg-clip-text text-transparent flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary animate-pulse" />
                Smart Deal Flow & RAG Search
              </CardTitle>
              <CardDescription className="text-muted-foreground text-sm">
                Ask our neural engine for specific startup criteria in plain English. We'll find semantically matching deals and generate VC investment reports.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReindex}
              disabled={reindexing}
              className="text-xs h-8 border-primary/20 hover:border-primary/50 text-muted-foreground hover:text-foreground"
            >
              {reindexing ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  Indexing...
                </>
              ) : (
                <>
                  <Database className="h-3 w-3 mr-1" />
                  Sync Vector DB
                </>
              )}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <form onSubmit={handleSearch} className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g., 'I want AI-powered SaaS startups in healthcare using computer vision and raising under 500k'"
                  className="pl-10 h-12 bg-secondary/30 border-border/80 focus:border-primary/50 text-sm placeholder:text-muted-foreground/75"
                />
              </div>
              <Button type="submit" disabled={loading} className="bg-primary-gradient h-12 px-6 font-medium gap-1.5 shadow-lg shadow-primary/15 hover:shadow-primary/25 transition-all">
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Analyze
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={`h-12 w-12 p-0 border-border/80 ${showFilters ? 'bg-primary/10 text-primary border-primary/40' : ''}`}
              >
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </div>

            {/* Advanced Filters Drawer */}
            {showFilters && (
              <div className="p-4 rounded-xl bg-secondary/20 border border-border/50 space-y-4 animate-in slide-in-from-top-3 duration-200">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Advanced Semantic Filters</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground block mb-1">Target Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full h-9 rounded-lg bg-secondary/50 border border-border/80 text-xs px-2.5 outline-none focus:border-primary/50 text-foreground"
                    >
                      <option value="">Any Category</option>
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground block mb-1">Required Tech Stack</label>
                    <Input
                      placeholder="e.g. PyTorch, React"
                      value={techStack}
                      onChange={(e) => setTechStack(e.target.value)}
                      className="h-9 bg-secondary/50 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground block mb-1">Min Funding (USD)</label>
                    <Input
                      type="number"
                      placeholder="Min"
                      value={minFunding}
                      onChange={(e) => setMinFunding(e.target.value)}
                      className="h-9 bg-secondary/50 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground block mb-1">Max Funding (USD)</label>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={maxFunding}
                      onChange={(e) => setMaxFunding(e.target.value)}
                      className="h-9 bg-secondary/50 text-xs"
                    />
                  </div>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* RAG Results Area */}
      {results && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Matches List */}
          <div className="lg:col-span-1 space-y-3">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Retrieved Matches ({results.total_matches})
              </span>
              <span className="text-[10px] text-muted-foreground bg-secondary/40 px-2 py-0.5 rounded-full flex items-center gap-1 border border-border/30">
                <Clock className="h-2.5 w-2.5" /> {results.latency_ms}ms
              </span>
            </div>

            {results.matched_projects.length === 0 ? (
              <Card className="glass-card p-6 text-center text-muted-foreground border-border/50">
                <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm">No matches found for your query. Try broadening your criteria.</p>
              </Card>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {results.matched_projects.map((proj, idx) => (
                  <Card key={proj.project_id} className="glass-card border-border/50 hover:border-primary/30 hover:shadow-md transition-all duration-300">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <Badge variant="secondary" className="text-[9px] px-1.5 py-0 mb-1.5 bg-primary/5 text-primary border-primary/20">
                            {proj.category || 'Startup'}
                          </Badge>
                          <h4 className="font-display font-semibold text-sm leading-snug line-clamp-1">
                            {proj.title}
                          </h4>
                        </div>
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] py-0 px-2 font-mono">
                          {Math.round(proj.similarity * 100)}% Match
                        </Badge>
                      </div>

                      <p className="text-xs text-muted-foreground/90 line-clamp-2 leading-relaxed">
                        {proj.tagline || 'Innovative student startup project.'}
                      </p>

                      <div className="flex flex-wrap gap-1 pt-1">
                        {proj.tech_stack.slice(0, 3).map(tech => (
                          <Badge key={tech} variant="outline" className="text-[9px] px-1 py-0 border-border/40 text-muted-foreground">
                            {tech}
                          </Badge>
                        ))}
                        {proj.tech_stack.length > 3 && (
                          <span className="text-[9px] text-muted-foreground mt-0.5 ml-1">+{proj.tech_stack.length - 3} more</span>
                        )}
                      </div>

                      <div className="pt-2 flex justify-between items-center text-[10px] text-muted-foreground border-t border-border/40">
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3 text-primary" />
                          {proj.funding_goal ? `$${proj.funding_goal.toLocaleString()}` : 'Not Specified'}
                        </span>
                        <Link to={`/startup/${proj.project_id}`} className="text-primary font-medium hover:underline flex items-center gap-0.5">
                          View Details
                          <ArrowRight className="h-2.5 w-2.5" />
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* AI Investor Recommendation */}
          <div className="lg:col-span-2">
            <Card className="glass-card border-primary/20 shadow-lg min-h-[400px] flex flex-col overflow-hidden">
              <CardHeader className="bg-primary/5 border-b border-border/50 py-3.5 px-5">
                <CardTitle className="font-display text-base font-semibold flex items-center gap-2 text-foreground">
                  <Lightbulb className="h-5 w-5 text-amber-400" />
                  DealFlow AI Investment Analysis & Recommendation
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 flex-1 overflow-y-auto max-h-[550px] prose dark:prose-invert max-w-none text-sm leading-relaxed prose-headings:font-display prose-headings:font-semibold prose-a:text-primary">
                {results.answer ? (
                  <ReactMarkdown>{results.answer}</ReactMarkdown>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground py-12">
                    <BookOpen className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm">Retrieval completed but AI analysis failed to generate.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
