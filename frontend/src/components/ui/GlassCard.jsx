import { Card } from "./card";
import { cn } from "../../lib/utils";

export default function GlassCard({
  children,
  className = "",
  variant = "default", // 'default' | 'periwinkle' | 'subtle' | 'interactive' | 'recovered' | 'risk' | 'ai'
  onClick,
  ...props
}) {
  const variantStyles = {
    default: "bg-[#f6f3f1] border-[#cecac8]",
    periwinkle: "bg-[#cfdaf5] border-[#a0b5eb]",
    subtle: "bg-transparent border-[#cecac8]",
    interactive: "cursor-pointer hover:border-[#242424] transition-all",
    recovered: "bg-[#f6f3f1] border-[#cecac8]",
    risk: "bg-[#f6f3f1] border-[#cecac8]",
    ai: "bg-[#f6f3f1] border-[#cecac8]",
    cyan: "bg-[#f6f3f1] border-[#cecac8]",
  };

  const selectedClass = variantStyles[variant] || variantStyles.default;

  return (
    <Card
      className={cn(
        "rounded-[28px] md:rounded-[40px] border p-6 sm:p-8 md:p-10 transition-colors shadow-none",
        selectedClass,
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </Card>
  );
}
