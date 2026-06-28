export interface Startup {
  id: string;
  name: string;
  tagline: string;
  description: string;
  problem: string;
  solution: string;
  logo: string;
  category: string;
  techStack: string[];
  upvotes: number;
  isFeatured: boolean;
  website?: string;
  github?: string;
  founder: {
    id: string;
    name: string;
    avatar: string;
    bio: string;
    github: string;
  };
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  count: number;
}

export const categories: Category[] = [
  { id: "1", name: "AI & ML", slug: "ai-ml", count: 24 },
  { id: "2", name: "SaaS", slug: "saas", count: 42 },
  { id: "3", name: "Developer Tools", slug: "developer-tools", count: 31 },
  { id: "4", name: "Fintech", slug: "fintech", count: 18 },
  { id: "5", name: "Health & Wellness", slug: "health-wellness", count: 15 },
  { id: "6", name: "E-commerce", slug: "ecommerce", count: 22 },
  { id: "7", name: "Productivity", slug: "productivity", count: 28 },
  { id: "8", name: "Education", slug: "education", count: 19 },
];

export const startups: Startup[] = [
  {
    id: "1",
    name: "NeuralDocs",
    tagline: "AI-powered document analysis and summarization for teams",
    description: "NeuralDocs uses cutting-edge LLMs to analyze, summarize, and extract insights from your documents. Perfect for legal teams, researchers, and knowledge workers who deal with large volumes of text.",
    problem: "Teams spend hours reading through lengthy documents, contracts, and research papers. Important information gets missed, and productivity suffers.",
    solution: "Our AI reads documents in seconds, extracts key points, answers questions, and generates summaries. Integrates with your existing workflow.",
    logo: "https://api.dicebear.com/7.x/shapes/svg?seed=neural&backgroundColor=6366f1",
    category: "AI & ML",
    techStack: ["React", "Python", "OpenAI", "PostgreSQL", "Docker"],
    upvotes: 342,
    isFeatured: true,
    website: "https://neuraldocs.io",
    github: "https://github.com/neuraldocs",
    founder: {
      id: "u1",
      name: "Sarah Chen",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
      bio: "Former Google engineer. Building AI tools for the future of work.",
      github: "sarahchen",
    },
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    name: "CodeSync",
    tagline: "Real-time collaborative code editor for remote teams",
    description: "CodeSync brings Google Docs-style collaboration to your IDE. Multiple developers can edit the same codebase simultaneously with real-time sync, conflict resolution, and integrated video chat.",
    problem: "Remote pair programming is clunky. Screen sharing has lag, and existing solutions don't integrate well with development workflows.",
    solution: "A browser-based IDE with VS Code extensions, real-time sync, integrated terminal sharing, and seamless Git integration.",
    logo: "https://api.dicebear.com/7.x/shapes/svg?seed=codesync&backgroundColor=10b981",
    category: "Developer Tools",
    techStack: ["TypeScript", "WebRTC", "CRDT", "Node.js", "Redis"],
    upvotes: 256,
    isFeatured: true,
    website: "https://codesync.dev",
    github: "https://github.com/codesync",
    founder: {
      id: "u2",
      name: "Marcus Rodriguez",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=marcus",
      bio: "Full-stack developer. Previously built tools at Stripe.",
      github: "marcusdev",
    },
    createdAt: "2024-02-01",
  },
  {
    id: "3",
    name: "PayFlow",
    tagline: "Subscription billing made ridiculously simple",
    description: "PayFlow handles everything from subscription management to revenue recognition. Built for SaaS companies who want to focus on their product, not billing infrastructure.",
    problem: "Billing is complex. Proration, upgrades, downgrades, failed payments, revenue recognition—it's a nightmare to build and maintain.",
    solution: "Drop-in React components, webhooks for everything, and a beautiful dashboard. Get paid faster with smart retry logic.",
    logo: "https://api.dicebear.com/7.x/shapes/svg?seed=payflow&backgroundColor=f59e0b",
    category: "Fintech",
    techStack: ["Next.js", "Stripe", "PostgreSQL", "Prisma", "AWS"],
    upvotes: 198,
    isFeatured: false,
    website: "https://payflow.io",
    founder: {
      id: "u3",
      name: "Emily Watson",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=emily",
      bio: "Fintech enthusiast. Former payments team at Square.",
      github: "emilyw",
    },
    createdAt: "2024-01-20",
  },
  {
    id: "4",
    name: "Contentful AI",
    tagline: "Generate SEO-optimized content with AI that understands your brand",
    description: "Train AI on your brand voice and let it generate blog posts, social media content, and marketing copy that sounds like you wrote it.",
    problem: "Generic AI content sounds robotic and off-brand. Writers spend more time editing AI output than writing from scratch.",
    solution: "Fine-tune models on your existing content. Built-in SEO optimization and plagiarism checking. Collaborative editing workspace.",
    logo: "https://api.dicebear.com/7.x/shapes/svg?seed=contentful&backgroundColor=ec4899",
    category: "AI & ML",
    techStack: ["Python", "FastAPI", "React", "MongoDB", "OpenAI"],
    upvotes: 167,
    isFeatured: false,
    website: "https://contentful-ai.com",
    founder: {
      id: "u4",
      name: "David Kim",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=david",
      bio: "Content strategist turned developer. Making AI work for marketers.",
      github: "davidkim",
    },
    createdAt: "2024-02-10",
  },
  {
    id: "5",
    name: "TaskForce",
    tagline: "Project management for teams who ship fast",
    description: "TaskForce combines the best of Linear, Notion, and GitHub Projects. Keyboard-first, blazingly fast, and designed for engineering teams.",
    problem: "Existing tools are either too complex or too simple. Teams waste time context-switching between multiple apps.",
    solution: "One unified workspace with issues, docs, and roadmaps. Real-time sync, offline support, and deep Git integration.",
    logo: "https://api.dicebear.com/7.x/shapes/svg?seed=taskforce&backgroundColor=8b5cf6",
    category: "Productivity",
    techStack: ["React", "Rust", "SQLite", "WebAssembly", "Cloudflare"],
    upvotes: 289,
    isFeatured: true,
    website: "https://taskforce.app",
    github: "https://github.com/taskforce-app",
    founder: {
      id: "u5",
      name: "Alex Thompson",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
      bio: "Productivity nerd. Building the tools I wish existed.",
      github: "alexthompson",
    },
    createdAt: "2024-01-25",
  },
  {
    id: "6",
    name: "LearnPath",
    tagline: "Personalized learning paths powered by AI tutoring",
    description: "LearnPath creates custom curriculum based on your goals and learning style. AI tutors provide 1:1 guidance and adapt to your progress.",
    problem: "Online courses are one-size-fits-all. Learners get stuck, lose motivation, and don't know what to learn next.",
    solution: "Adaptive learning algorithms, spaced repetition, and AI tutors that explain concepts in multiple ways until you truly understand.",
    logo: "https://api.dicebear.com/7.x/shapes/svg?seed=learnpath&backgroundColor=06b6d4",
    category: "Education",
    techStack: ["Next.js", "Python", "TensorFlow", "PostgreSQL", "Vercel"],
    upvotes: 145,
    isFeatured: false,
    website: "https://learnpath.io",
    founder: {
      id: "u6",
      name: "Priya Patel",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=priya",
      bio: "EdTech founder. Former teacher on a mission to democratize education.",
      github: "priyapatel",
    },
    createdAt: "2024-02-05",
  },
];

export const getStartupById = (id: string): Startup | undefined => {
  return startups.find((s) => s.id === id);
};

export const getFeaturedStartups = (): Startup[] => {
  return startups.filter((s) => s.isFeatured);
};

export const getStartupsByCategory = (category: string): Startup[] => {
  return startups.filter((s) => s.category.toLowerCase().replace(/\s+/g, "-") === category);
};
