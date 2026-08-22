export function Avatar({
  name,
  photoUrl,
  size = 40,
  indicator,
}: {
  name: string;
  photoUrl?: string | null;
  size?: number;
  indicator?: "online" | "away" | "offline";
}) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  // Solid operational colors keep avatars distinct without breaking the brand system.
  const colors = [
    "bg-brand",
    "bg-slate-700",
    "bg-amber-700",
    "bg-teal-700",
    "bg-blue-800",
    "bg-danger",
  ];
  const charCodeSum = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colorScheme = colors[charCodeSum % colors.length];

  return (
    <div className="relative inline-flex shrink-0">
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoUrl}
          alt={name}
          width={size}
          height={size}
          style={{ width: size, height: size }}
          className="rounded-md object-cover ring-1 ring-foreground/20"
        />
      ) : (
        <span
          aria-hidden
          style={{ width: size, height: size, fontSize: Math.max(11, size * 0.36) }}
          className={`grid place-items-center rounded-md ${colorScheme} font-bold text-white ring-1 ring-foreground/20`}
        >
          {initials || "?"}
        </span>
      )}

      {indicator && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-surface ${
            indicator === "online"
              ? "bg-emerald-500"
              : indicator === "away"
                ? "bg-amber-500"
                : "bg-slate-400"
          }`}
        />
      )}
    </div>
  );
}
