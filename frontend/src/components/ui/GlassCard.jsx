import { Card } from "./card";
import { cn } from "../../lib/utils";

export default function GlassCard({
  children,
  className = "",
  variant = "default", // 'default' | 'recovered' | 'risk' | 'ai' | 'interactive'
  onClick,
  ...props
}) {
  const variantStyles = {
    default: "",
    interactive: "cursor-pointer transition-shadow hover:shadow-md",
    recovered: "border-emerald-200",
    risk: "border-rose-200",
    ai: "border-violet-200",
    cyan: "border-sky-200",
  };

  const selectedClass = variantStyles[variant] || variantStyles.default;

  return (
    <Card
      className={cn("rounded-xl p-5", selectedClass, className)}
      onClick={onClick}
      {...props}
    >
      {children}
    </Card>
  );
}
