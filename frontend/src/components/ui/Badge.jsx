export default function Badge({
  label,
  children,
  variant = "default", // 'recovered' | 'risk' | 'warning' | 'ai' | 'cyan' | 'default'
  size = "md", // 'sm' | 'md'
  pulsing = false,
  className = "",
}) {
  const variantStyles = {
    recovered: "bg-[#f6f3f1] text-[#242424] border-[#a7fccd]",
    risk: "bg-[#f6f3f1] text-[#242424] border-[#ff9473]",
    warning: "bg-[#f6f3f1] text-[#242424] border-[#ecda98]",
    ai: "bg-[#cfdaf5]/40 text-[#242424] border-[#a0b5eb]",
    cyan: "bg-[#cfdaf5]/40 text-[#242424] border-[#a0b5eb]",
    default: "bg-[#f6f3f1] text-[#4e4d4d] border-[#cecac8]",
  };

  const dotColors = {
    recovered: "bg-[#059669]",
    risk: "bg-[#ff9473]",
    warning: "bg-[#f37a0a]",
    ai: "bg-[#2b59d1]",
    cyan: "bg-[#2b59d1]",
    default: "bg-[#797776]",
  };

  const sizeClasses = {
    sm: "px-2.5 py-0.5 text-[10px]",
    md: "px-3.5 py-1 text-[11px]",
  };

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border font-mono uppercase tracking-wider transition-colors ${variantStyles[variant] || variantStyles.default} ${sizeClasses[size]} ${className}`}
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
      <span>{children || label}</span>
    </span>
  );
}