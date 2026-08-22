import Image from "next/image";

export function Brand({
  size = "md",
  showTagline = false,
}: {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
}) {
  const logoSizes = {
    sm: { width: 122, height: 38 },
    md: { width: 146, height: 46 },
    lg: { width: 184, height: 58 },
  };
  const logoSize = logoSizes[size];

  return (
    <div className="inline-flex flex-col items-start">
      <Image
        src="/brand/dayflow-logo.png"
        alt="Dayflow"
        width={logoSize.width}
        height={logoSize.height}
        priority={size === "lg"}
      />
      {showTagline && (
        <p className="mt-1 text-xs text-muted">Every workday, perfectly aligned</p>
      )}
    </div>
  );
}
