const StartupCardSkeleton = () => {
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex gap-4">
        {/* Logo Skeleton */}
        <div className="flex-shrink-0">
          <div className="h-14 w-14 rounded-xl bg-muted animate-pulse" />
        </div>

        {/* Content Skeleton */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="h-5 w-32 bg-muted rounded animate-pulse" />
              <div className="h-4 w-full bg-muted rounded mt-2 animate-pulse" />
              <div className="h-4 w-2/3 bg-muted rounded mt-1 animate-pulse" />
            </div>
            <div className="h-14 w-12 bg-muted rounded-lg animate-pulse" />
          </div>

          <div className="flex items-center gap-3 mt-3">
            <div className="h-6 w-20 bg-muted rounded-md animate-pulse" />
            <div className="h-5 w-5 bg-muted rounded-full animate-pulse" />
            <div className="h-4 w-16 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StartupCardSkeleton;
