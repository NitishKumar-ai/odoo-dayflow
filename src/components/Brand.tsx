export function Brand({ size = "md" }: { size?: "md" | "lg" }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        aria-hidden
        className="grid h-9 w-9 place-items-center rounded-lg bg-brand text-white font-semibold"
      >
        D
      </span>
      <span className={size === "lg" ? "text-xl font-semibold" : "font-semibold"}>
        Dayflow
      </span>
    </div>
  );
}
