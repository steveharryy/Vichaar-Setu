import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Sparkles, Loader2, TrendingUp, Target, AlertTriangle,
  CheckCircle, XCircle, ChevronDown, ChevronUp, Users
} from 'lucide-react';

export interface InvestorMatch {
  investor_clerk_id: string;
  investor_name: string;
  avatar_url: string | null;
  match_score: number;
  strengths: string[];
  gaps: string[];
  recommendation: string;
}

interface InvestorMatchPanelProps {
  projectId: string;
  projectTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const InvestorMatchPanel = ({ projectId, projectTitle, isOpen, onClose }: InvestorMatchPanelProps) => {
  const [matches, setMatches] = useState<InvestorMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [isDemoMode, setIsDemoMode] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-400';
    if (score >= 70) return 'text-primary';
    if (score >= 50) return 'text-amber-400';
    return 'text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 85) return 'bg-emerald-500/10 border-emerald-500/30';
    if (score >= 70) return 'bg-primary/10 border-primary/30';
    if (score >= 50) return 'bg-amber-500/10 border-amber-500/30';
    return 'bg-red-500/10 border-red-500/30';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 85) return 'Excellent Match';
    if (score >= 70) return 'Strong Match';
    if (score >= 50) return 'Moderate Match';
    return 'Low Match';
  };

  const toggleExpand = (id: string) => {
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const findMatches = async () => {
    setLoading(true);
    setHasSearched(true);

    try {
      const response = await fetch(`${API_URL}/api/investor-match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      setMatches(data.matches || []);
      setIsDemoMode(false);

      if ((data.matches || []).length === 0) {
        toast.info('No investor profiles found. Investors need to set their preferences first.');
      } else {
        toast.success(`Found ${data.matches.length} potential investor match${data.matches.length > 1 ? 'es' : ''}!`);
      }
    } catch (error) {
      console.warn('AI Matching backend not available, generating demo results...', error);
      setIsDemoMode(true);

      // Demo fallback with realistic mock data
      const demoMatches: InvestorMatch[] = [
        {
          investor_clerk_id: 'demo_1',
          investor_name: 'Rajesh Malhotra',
          avatar_url: null,
          match_score: 92,
          strengths: ['Strong category alignment with investment thesis', 'Tech stack matches portfolio focus', 'Funding goal within check size range'],
          gaps: ['Early-stage traction data needed'],
          recommendation: 'Excellent strategic fit. The project aligns closely with the investor\'s focus on early-stage tech ventures in this category.',
        },
        {
          investor_clerk_id: 'demo_2',
          investor_name: 'Priya Sharma',
          avatar_url: null,
          match_score: 78,
          strengths: ['Innovative solution approach', 'Growing market opportunity'],
          gaps: ['Category is secondary focus', 'Check size slightly above preference'],
          recommendation: 'Good potential match. The innovative approach aligns with the investor\'s interest in disruptive technology.',
        },
        {
          investor_clerk_id: 'demo_3',
          investor_name: 'Vikram Patel',
          avatar_url: null,
          match_score: 64,
          strengths: ['Market opportunity recognized'],
          gaps: ['Tech stack mismatch with portfolio', 'Funding goal exceeds typical range'],
          recommendation: 'Moderate fit. Worth exploring if the investor is expanding into adjacent verticals.',
        },
      ];

      setMatches(demoMatches);
      toast.info('Showing demo results — connect your backend for live AI matching.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="glass-card-strong sm:max-w-2xl max-h-[85vh] p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-border/50">
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10">
              <Target className="h-5 w-5 text-primary" />
            </div>
            AI Investor Matching
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Find the best-fit investors for <span className="font-medium text-foreground">{projectTitle}</span> using AI-powered portfolio analysis.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[60vh]">
          <div className="p-6 space-y-4">
            {/* Action Button */}
            {!hasSearched && !loading && (
              <div className="text-center py-8 space-y-4">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="h-10 w-10 text-primary" />
                </div>
                <h3 className="font-display text-lg font-semibold">
                  Ready to Find Your Ideal Investors?
                </h3>
                <p className="text-muted-foreground text-sm max-w-md mx-auto">
                  Our AI engine analyzes your project against investor portfolios, considering category fit, 
                  tech stack alignment, check size compatibility, and investment thesis.
                </p>
                <Button 
                  onClick={findMatches} 
                  className="bg-primary-gradient mt-4 px-8"
                  size="lg"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Find Matching Investors
                </Button>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="text-center py-12 space-y-4">
                <div className="relative w-16 h-16 mx-auto">
                  <Loader2 className="h-16 w-16 animate-spin text-primary/30" />
                  <Sparkles className="h-6 w-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                </div>
                <p className="text-muted-foreground text-sm animate-pulse">
                  AI is analyzing investor portfolios...
                </p>
              </div>
            )}

            {/* Results */}
            {hasSearched && !loading && (
              <>
                {isDemoMode && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-warning/10 border border-warning/30 text-warning text-xs">
                    <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>Demo Mode — Connect your backend for live AI investor matching</span>
                  </div>
                )}

                {matches.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No matching investors found. Ask investors to set their preferences.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Found <span className="font-semibold text-foreground">{matches.length}</span> potential matches
                      </p>
                      <Button variant="ghost" size="sm" onClick={findMatches} className="text-xs h-7">
                        <Sparkles className="h-3 w-3 mr-1" /> Re-analyze
                      </Button>
                    </div>

                    {matches.map((match, index) => (
                      <Card 
                        key={match.investor_clerk_id} 
                        className={`glass-card overflow-hidden transition-all duration-300 animate-fade-up`}
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        {/* Main Row */}
                        <div className="p-4">
                          <div className="flex items-center gap-3">
                            {/* Avatar */}
                            <div className="h-12 w-12 rounded-xl bg-primary-gradient flex items-center justify-center text-primary-foreground font-display font-bold text-lg flex-shrink-0">
                              {match.investor_name[0]}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-display font-semibold truncate">{match.investor_name}</h4>
                              <p className="text-xs text-muted-foreground truncate">{match.recommendation}</p>
                            </div>

                            {/* Score */}
                            <div className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl border ${getScoreBg(match.match_score)}`}>
                              <span className={`font-display text-2xl font-bold ${getScoreColor(match.match_score)}`}>
                                {match.match_score}%
                              </span>
                              <span className={`text-[9px] uppercase tracking-wider font-semibold ${getScoreColor(match.match_score)}`}>
                                {getScoreLabel(match.match_score)}
                              </span>
                            </div>
                          </div>

                          {/* Score Bar */}
                          <div className="mt-3">
                            <Progress value={match.match_score} className="h-1.5" />
                          </div>

                          {/* Toggle expand */}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full mt-2 h-7 text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => toggleExpand(match.investor_clerk_id)}
                          >
                            {expandedCards[match.investor_clerk_id] ? (
                              <>Hide Details <ChevronUp className="h-3 w-3 ml-1" /></>
                            ) : (
                              <>View AI Analysis <ChevronDown className="h-3 w-3 ml-1" /></>
                            )}
                          </Button>
                        </div>

                        {/* Expanded Details */}
                        {expandedCards[match.investor_clerk_id] && (
                          <div className="px-4 pb-4 space-y-3 border-t border-border/50 pt-3 animate-in slide-in-from-top-2 duration-200">
                            {/* Strengths */}
                            <div>
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Strengths</span>
                              </div>
                              <ul className="space-y-1">
                                {match.strengths.map((s, i) => (
                                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                                    <TrendingUp className="h-3 w-3 text-emerald-400/60 mt-0.5 flex-shrink-0" />
                                    {s}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Gaps */}
                            {match.gaps.length > 0 && (
                              <div>
                                <div className="flex items-center gap-1.5 mb-1.5">
                                  <XCircle className="h-3.5 w-3.5 text-amber-400" />
                                  <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Gaps</span>
                                </div>
                                <ul className="space-y-1">
                                  {match.gaps.map((g, i) => (
                                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                                      <AlertTriangle className="h-3 w-3 text-amber-400/60 mt-0.5 flex-shrink-0" />
                                      {g}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Recommendation */}
                            <div className="bg-secondary/30 rounded-lg p-3 border border-border/50">
                              <div className="flex items-center gap-1.5 mb-1">
                                <Sparkles className="h-3.5 w-3.5 text-primary" />
                                <span className="text-xs font-semibold text-primary uppercase tracking-wider">AI Recommendation</span>
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed">{match.recommendation}</p>
                            </div>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default InvestorMatchPanel;
