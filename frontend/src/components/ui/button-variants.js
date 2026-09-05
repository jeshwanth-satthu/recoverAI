import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[100px] font-mono text-xs uppercase tracking-wider transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#242424] disabled:pointer-events-none disabled:opacity-40 cursor-pointer select-none",
  {
    variants: {
      variant: {
        primary: "bg-[#2b59d1] text-white hover:bg-[#2349ac] border border-transparent shadow-none active:scale-[0.98]",
        secondary: "bg-[#242424] text-[#f6f3f1] hover:bg-[#000000] border border-transparent shadow-none active:scale-[0.98]",
        ghost: "bg-transparent border border-[#242424] text-[#242424] hover:bg-[#242424] hover:text-[#f6f3f1] active:scale-[0.98]",
        subtle: "bg-transparent border border-[#cecac8] text-[#4e4d4d] hover:border-[#242424] hover:text-[#242424] active:scale-[0.98]",
        success: "bg-[#242424] text-white hover:bg-[#000000] border border-transparent active:scale-[0.98]",
        danger: "bg-transparent border border-[#ff9473] text-[#ff9473] hover:bg-[#ff9473] hover:text-white active:scale-[0.98]",
        glass: "bg-transparent border border-[#cecac8] text-[#242424] hover:border-[#242424] active:scale-[0.98]",
      },
      size: {
        sm: "h-9 px-4 text-[11px]",
        md: "h-11 px-6 text-xs",
        lg: "h-12 px-8 text-xs",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);
