import { Link } from "react-router-dom";
import { ArrowUp, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StartupCardProps {
  id: string;
  name: string;
  tagline: string;
  logo: string;
  category: string;
  upvotes: number;
  isFeatured?: boolean;
  founder?: {
    name: string;
    avatar: string;
  };
  onUpvote?: (e: React.MouseEvent) => void;
  isUpvoted?: boolean;
}

const StartupCard = ({
  id,
  name,
  tagline,
  logo,
  category,
  upvotes,
  isFeatured = false,
  founder,
  onUpvote,
  isUpvoted = false,
}: StartupCardProps) => {
  return (
    <div
      className={cn(
        "group relative glass-card rounded-2xl p-5 hover-lift",
        isFeatured && "ring-2 ring-primary/20"
      )}
    >
      {isFeatured && (
        <div className="absolute -top-3 left-4">
          <span className="badge-featured">
            <Star className="h-3 w-3" />
            Featured
          </span>
        </div>
      )}

      <Link to={`/startup/${id}`} className="flex gap-4">
        {/* Logo */}
        <div className="flex-shrink-0">
          <div className="h-14 w-14 rounded-xl bg-secondary overflow-hidden ring-1 ring-border/50">
            <img
              src={logo}
              alt={name}
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-display font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                {name}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                {tagline}
              </p>
            </div>

            {/* Upvote Button */}
            <Button
              variant={isUpvoted ? "secondary" : "outline"}
              size="sm"
              className={cn(
                "flex-shrink-0 flex-col h-auto py-2 px-3 gap-0.5 transition-colors",
                isUpvoted ? "opacity-70 cursor-not-allowed border-none bg-secondary/50" : "hover:border-primary hover:text-primary"
              )}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (isUpvoted) return;
                if (onUpvote) onUpvote(e);
              }}
              disabled={isUpvoted}
              title={isUpvoted ? "Already upvoted" : "Upvote"}
            >
              <ArrowUp className={cn("h-4 w-4", isUpvoted ? "text-muted-foreground" : "text-primary")} />
              <span className="text-xs font-semibold">{upvotes}</span>
            </Button>
          </div>

          {/* Meta */}
          <div className="flex items-center gap-3 mt-3">
            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-secondary text-xs font-medium text-muted-foreground">
              {category}
            </span>
            {founder && (
              <div className="flex items-center gap-2">
                <img
                  src={founder.avatar}
                  alt={founder.name}
                  className="h-5 w-5 rounded-full ring-1 ring-border"
                />
                <span className="text-xs text-muted-foreground">{founder.name}</span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default StartupCard;
