export function Avatar({
  name,
  photoUrl,
  size = 40,
}: {
  name: string;
  photoUrl?: string | null;
  size?: number;
}) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  if (photoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={photoUrl}
        alt=""
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className="rounded-full object-cover ring-1 ring-line"
      />
    );
  }

  return (
    <span
      aria-hidden
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      className="grid place-items-center rounded-full bg-brand-soft font-semibold text-brand ring-1 ring-line"
    >
      {initials || "?"}
    </span>
  );
}
