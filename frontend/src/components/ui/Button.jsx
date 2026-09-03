import { Loader2 } from "lucide-react";

import { cn } from "../../lib/utils";
import { playClickSound, playHoverSound } from "../../lib/soundFX";
import { buttonVariants } from "./button-variants";

export default function Button({
  children,
  onClick,
  variant,
  size,
  disabled = false,
  loading = false,
  icon: Icon,
  className,
  type = "button",
  playAudio = true,
  ...props
}) {
  const handleClick = (event) => {
    if (disabled || loading) return;
    if (playAudio) playClickSound();
    onClick?.(event);
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={handleClick}
      onMouseEnter={() => !disabled && !loading && playAudio && playHoverSound()}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {loading ? <Loader2 className="animate-spin" size={14} /> : Icon ? <Icon size={14} /> : null}
      {children}
    </button>
  );
}
