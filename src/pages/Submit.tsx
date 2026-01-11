import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  Link as LinkIcon,
  Github,
  Globe,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

const STARTUP_CATEGORIES = [
  { id: "fintech", name: "FinTech", slug: "fintech" },
  { id: "healthcare", name: "Healthcare", slug: "healthcare" },
  { id: "edtech", name: "EdTech", slug: "edtech" },
  { id: "ecommerce", name: "E-commerce", slug: "ecommerce" },
  { id: "ai-ml", name: "AI/ML", slug: "ai-ml" },
  { id: "saas", name: "SaaS", slug: "saas" },
  { id: "social-media", name: "Social Media", slug: "social-media" },
  { id: "gaming", name: "Gaming", slug: "gaming" },
  { id: "cleantech", name: "CleanTech", slug: "cleantech" },
  { id: "agritech", name: "AgriTech", slug: "agritech" },
  { id: "proptech", name: "PropTech", slug: "proptech" },
  { id: "foodtech", name: "FoodTech", slug: "foodtech" },
  { id: "logistics", name: "Logistics", slug: "logistics" },
  { id: "cybersecurity", name: "Cybersecurity", slug: "cybersecurity" },
  { id: "iot", name: "IoT", slug: "iot" },
  { id: "other", name: "Other", slug: "other" },
];

const Submit = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    name: "",
    tagline: "",
    description: "",
    problem: "",
    solution: "",
    category: "",
    techStack: "",
    website: "",
    github: "",
    logo: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate submission
    await new Promise((resolve) => setTimeout(resolve, 1500));

    toast({
      title: "Startup Submitted! 🎉",
      description: "Your startup has been submitted for review.",
    });

    setIsSubmitting(false);
    navigate("/explore");
  };

  const steps = [
    { number: 1, title: "Basic Info" },
    { number: 2, title: "Details" },
    { number: 3, title: "Links" },
  ];

  return (
    <Layout>
      <div className="min-h-screen py-12">
        <div className="container max-w-3xl">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary-gradient mb-4 shadow-glow">
              <Sparkles className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
              Submit Your Startup
            </h1>
            <p className="text-muted-foreground">
              Share your idea with the community and get early feedback
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 mb-12">
            {steps.map((s, index) => (
              <div key={s.number} className="flex items-center">
                <button
                  onClick={() => setStep(s.number)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    step >= s.number
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  <span className="font-semibold">{s.number}</span>
                  <span className="hidden sm:inline text-sm">{s.title}</span>
                </button>
                {index < steps.length - 1 && (
                  <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-6 animate-fade-in">
                <div className="glass-card rounded-2xl p-6 md:p-8">
                  <h2 className="font-display text-xl font-semibold mb-6">
                    Basic Information
                  </h2>

                  <div className="space-y-6">
                    {/* Logo Upload */}
                    <div>
                      <Label htmlFor="logo">Startup Logo</Label>
                      <div className="mt-2 flex items-center gap-4">
                        <div className="h-20 w-20 rounded-2xl bg-secondary border-2 border-dashed border-border flex items-center justify-center">
                          {formData.logo ? (
                            <img
                              src={formData.logo}
                              alt="Logo preview"
                              className="h-full w-full object-cover rounded-2xl"
                            />
                          ) : (
                            <Upload className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1">
                          <Input
                            id="logo"
                            name="logo"
                            placeholder="Paste logo URL or upload"
                            value={formData.logo}
                            onChange={handleChange}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Recommended: 400x400px PNG or SVG
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Name */}
                    <div>
                      <Label htmlFor="name">Startup Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="e.g., NeuralDocs"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="mt-2"
                      />
                    </div>

                    {/* Tagline */}
                    <div>
                      <Label htmlFor="tagline">Tagline *</Label>
                      <Input
                        id="tagline"
                        name="tagline"
                        placeholder="e.g., AI-powered document analysis for teams"
                        value={formData.tagline}
                        onChange={handleChange}
                        required
                        className="mt-2"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Keep it short and catchy (max 80 characters)
                      </p>
                    </div>

                    {/* Category */}
                    <div>
                      <Label>Category *</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) =>
                          setFormData((prev) => ({ ...prev, category: value }))
                        }
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border shadow-lg z-50">
                          {STARTUP_CATEGORIES.map((cat) => (
                            <SelectItem key={cat.id} value={cat.slug}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="hero"
                  size="lg"
                  className="w-full"
                  onClick={() => setStep(2)}
                >
                  Continue
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}

            {/* Step 2: Details */}
            {step === 2 && (
              <div className="space-y-6 animate-fade-in">
                <div className="glass-card rounded-2xl p-6 md:p-8">
                  <h2 className="font-display text-xl font-semibold mb-6">
                    Tell Us More
                  </h2>

                  <div className="space-y-6">
                    {/* Description */}
                    <div>
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        name="description"
                        placeholder="What does your startup do? Who is it for?"
                        value={formData.description}
                        onChange={handleChange}
                        required
                        rows={4}
                        className="mt-2"
                      />
                    </div>

                    {/* Problem */}
                    <div>
                      <Label htmlFor="problem">The Problem *</Label>
                      <Textarea
                        id="problem"
                        name="problem"
                        placeholder="What problem are you solving?"
                        value={formData.problem}
                        onChange={handleChange}
                        required
                        rows={3}
                        className="mt-2"
                      />
                    </div>

                    {/* Solution */}
                    <div>
                      <Label htmlFor="solution">Your Solution *</Label>
                      <Textarea
                        id="solution"
                        name="solution"
                        placeholder="How does your startup solve this problem?"
                        value={formData.solution}
                        onChange={handleChange}
                        required
                        rows={3}
                        className="mt-2"
                      />
                    </div>

                    {/* Tech Stack */}
                    <div>
                      <Label htmlFor="techStack">Tech Stack</Label>
                      <Input
                        id="techStack"
                        name="techStack"
                        placeholder="e.g., React, Node.js, PostgreSQL"
                        value={formData.techStack}
                        onChange={handleChange}
                        className="mt-2"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Separate technologies with commas
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="flex-1"
                    onClick={() => setStep(1)}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    variant="hero"
                    size="lg"
                    className="flex-1"
                    onClick={() => setStep(3)}
                  >
                    Continue
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Links */}
            {step === 3 && (
              <div className="space-y-6 animate-fade-in">
                <div className="glass-card rounded-2xl p-6 md:p-8">
                  <h2 className="font-display text-xl font-semibold mb-6">
                    Links & Resources
                  </h2>

                  <div className="space-y-6">
                    {/* Website */}
                    <div>
                      <Label htmlFor="website">Website URL</Label>
                      <div className="relative mt-2">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="website"
                          name="website"
                          placeholder="https://yourwebsite.com"
                          value={formData.website}
                          onChange={handleChange}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    {/* GitHub */}
                    <div>
                      <Label htmlFor="github">GitHub Repository</Label>
                      <div className="relative mt-2">
                        <Github className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="github"
                          name="github"
                          placeholder="https://github.com/yourrepo"
                          value={formData.github}
                          onChange={handleChange}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="flex-1"
                    onClick={() => setStep(2)}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    variant="hero"
                    size="lg"
                    className="flex-1"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Submitting..." : "Submit Startup"}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default Submit;
