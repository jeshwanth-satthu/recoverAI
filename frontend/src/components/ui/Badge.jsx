export default function Badge({
  label,
  variant = "default", // 'recovered' | 'risk' | 'warning' | 'ai' | 'cyan' | 'default'
  size = "md", // 'sm' | 'md'
  pulsing = false,
  className = "",
}) {
  const variantStyles = {
    recovered: "bg-emerald-50 text-emerald-700 border-emerald-300/80",
    risk: "bg-rose-50 text-rose-700 border-rose-300/80",
    warning: "bg-amber-50 text-amber-800 border-amber-300/80",
    ai: "bg-violet-50 text-violet-700 border-violet-300/80",
    cyan: "bg-sky-50 text-sky-700 border-sky-300/80",
    default: "bg-slate-100 text-slate-700 border-slate-200",
  };

  const dotColors = {
    recovered: "bg-emerald-500",
    risk: "bg-rose-500",
    warning: "bg-amber-500",
    ai: "bg-violet-600",
    cyan: "bg-sky-500",
    default: "bg-slate-500",
  };

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs font-medium",
    md: "px-2.5 py-1 text-xs font-semibold",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border backdrop-blur-md transition-colors ${variantStyles[variant] || variantStyles.default} ${sizeClasses[size]} ${className}`}
    >
      <span className="relative flex h-1.5 w-1.5">
        {pulsing && (
          <span
            className={`absolute inline-flex h-full w-full rounded-full opacity-75 radar-ping ${dotColors[variant] || dotColors.default}`}
          />
        )}
        <span
          className={`relative inline-flex h-1.5 w-1.5 rounded-full ${dotColors[variant] || dotColors.default}`}
        />
      </span>
      <span>{label}</span>
    </span>
  );
}