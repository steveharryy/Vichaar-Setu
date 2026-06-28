import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Settings, Loader2, Save, X, Plus } from 'lucide-react';
import { saveInvestorPreferences, getInvestorPreferences } from '@/lib/database';

interface InvestorPreferencesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  investorClerkId: string;
}

const CATEGORY_OPTIONS = [
  'AI & ML', 'SaaS', 'FinTech', 'Health & Wellness', 'EdTech',
  'E-commerce', 'Developer Tools', 'Productivity', 'CleanTech',
  'Gaming', 'Social Impact', 'Blockchain', 'IoT', 'Cybersecurity'
];

const TECH_OPTIONS = [
  'React', 'Next.js', 'Node.js', 'Python', 'TypeScript', 'PostgreSQL',
  'MongoDB', 'AWS', 'GCP', 'Docker', 'Kubernetes', 'TensorFlow',
  'PyTorch', 'Flutter', 'React Native', 'Go', 'Rust', 'Solidity'
];

const InvestorPreferencesDialog = ({ isOpen, onClose, investorClerkId }: InvestorPreferencesDialogProps) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [techStack, setTechStack] = useState<string[]>([]);
  const [minFunding, setMinFunding] = useState('0');
  const [maxFunding, setMaxFunding] = useState('100000');
  const [thesis, setThesis] = useState('');

  useEffect(() => {
    if (isOpen && investorClerkId) {
      loadPreferences();
    }
  }, [isOpen, investorClerkId]);

  const loadPreferences = async () => {
    setLoading(true);
    try {
      const prefs = await getInvestorPreferences(investorClerkId);
      if (prefs) {
        setCategories(prefs.preferred_categories || []);
        setTechStack(prefs.preferred_tech_stack || []);
        setMinFunding(String(prefs.min_funding || 0));
        setMaxFunding(String(prefs.max_funding || 100000));
        setThesis(prefs.investment_thesis || '');
      }
    } catch (error) {
      console.warn('Could not load preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (cat: string) => {
    setCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const toggleTech = (tech: string) => {
    setTechStack(prev =>
      prev.includes(tech) ? prev.filter(t => t !== tech) : [...prev, tech]
    );
  };

  const handleSave = async () => {
    if (categories.length === 0) {
      toast.error('Please select at least one preferred category.');
      return;
    }

    setSaving(true);
    try {
      await saveInvestorPreferences({
        investor_clerk_id: investorClerkId,
        preferred_categories: categories,
        min_funding: Number(minFunding) || 0,
        max_funding: Number(maxFunding) || 1000000,
        preferred_tech_stack: techStack,
        investment_thesis: thesis,
      });
      toast.success('Investment preferences saved! AI matching will now use these.');
      onClose();
    } catch (error) {
      console.error('Failed to save preferences:', error);
      toast.error('Failed to save preferences. Make sure the backend is running.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="glass-card-strong sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10">
              <Settings className="h-5 w-5 text-primary" />
            </div>
            Investment Preferences
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Set your portfolio preferences so the AI can match you with the most relevant startups.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-5 mt-2">
            {/* Preferred Categories */}
            <div>
              <label className="text-sm font-medium mb-2 block">Preferred Categories</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_OPTIONS.map(cat => (
                  <Badge
                    key={cat}
                    variant={categories.includes(cat) ? 'default' : 'outline'}
                    className={`cursor-pointer transition-all text-xs px-3 py-1 ${
                      categories.includes(cat)
                        ? 'bg-primary text-primary-foreground hover:bg-primary/80'
                        : 'hover:border-primary/50 hover:text-primary'
                    }`}
                    onClick={() => toggleCategory(cat)}
                  >
                    {categories.includes(cat) ? <X className="h-3 w-3 mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
                    {cat}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Check Size Range */}
            <div>
              <label className="text-sm font-medium mb-2 block">Check Size Range (USD)</label>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Input
                    type="number"
                    value={minFunding}
                    onChange={(e) => setMinFunding(e.target.value)}
                    placeholder="Min ($)"
                    className="bg-secondary/50"
                  />
                </div>
                <span className="text-muted-foreground">to</span>
                <div className="flex-1">
                  <Input
                    type="number"
                    value={maxFunding}
                    onChange={(e) => setMaxFunding(e.target.value)}
                    placeholder="Max ($)"
                    className="bg-secondary/50"
                  />
                </div>
              </div>
            </div>

            {/* Preferred Tech */}
            <div>
              <label className="text-sm font-medium mb-2 block">Preferred Tech Stack</label>
              <div className="flex flex-wrap gap-2">
                {TECH_OPTIONS.map(tech => (
                  <Badge
                    key={tech}
                    variant={techStack.includes(tech) ? 'default' : 'outline'}
                    className={`cursor-pointer transition-all text-xs px-3 py-1 ${
                      techStack.includes(tech)
                        ? 'bg-accent text-accent-foreground hover:bg-accent/80'
                        : 'hover:border-accent/50'
                    }`}
                    onClick={() => toggleTech(tech)}
                  >
                    {tech}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Investment Thesis */}
            <div>
              <label className="text-sm font-medium mb-2 block">Investment Thesis / Focus</label>
              <Textarea
                value={thesis}
                onChange={(e) => setThesis(e.target.value)}
                placeholder="Describe your investment focus, stage preference, sectors of interest, what you look for in founders..."
                rows={3}
                className="bg-secondary/50"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button className="flex-1 bg-primary-gradient" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save Preferences
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default InvestorPreferencesDialog;
