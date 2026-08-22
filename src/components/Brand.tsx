export function Brand({
  size = "md",
  showTagline = false,
}: {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
}) {
  const iconSizes = {
    sm: "h-7 w-7 text-xs rounded-lg",
    md: "h-9 w-9 text-sm rounded-xl",
    lg: "h-11 w-11 text-base rounded-xl shadow-lg shadow-brand/20",
  };

  const textSizes = {
    sm: "text-base font-bold tracking-tight",
    md: "text-lg font-bold tracking-tight",
    lg: "text-2xl font-extrabold tracking-tight",
  };

  return (
    <div className="inline-flex items-center gap-3">
      <div className="relative">
        <div
          aria-hidden
          className={`grid ${iconSizes[size]} place-items-center bg-gradient-to-tr from-brand to-indigo-500 font-extrabold text-white shadow-xs`}
        >
          <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
      </div>
      <div>
        <div className="flex items-center gap-1.5">
          <span className={textSizes[size]}>Dayflow</span>
          <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand">
            HRMS
          </span>
        </div>
        {showTagline && (
          <p className="text-xs text-muted">Every workday, perfectly aligned</p>
        )}
      </div>
    </div>
  );
}
