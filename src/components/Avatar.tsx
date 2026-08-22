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

  // Color generator based on name hash
  const colors = [
    "from-blue-500 to-indigo-600",
    "from-emerald-500 to-teal-600",
    "from-purple-500 to-pink-600",
    "from-amber-500 to-orange-600",
    "from-cyan-500 to-blue-600",
    "from-rose-500 to-red-600",
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
          className="rounded-2xl object-cover ring-2 ring-line/80 shadow-xs"
        />
      ) : (
        <span
          aria-hidden
          style={{ width: size, height: size, fontSize: Math.max(11, size * 0.36) }}
          className={`grid place-items-center rounded-2xl bg-gradient-to-tr ${colorScheme} font-bold text-white shadow-xs ring-2 ring-line/80`}
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
