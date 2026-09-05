import { cn } from "../../lib/utils";

function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        "rounded-[28px] md:rounded-[40px] border border-[#cecac8] bg-[#f6f3f1] text-[#242424] transition-colors",
        className
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }) {
  return <div className={cn("flex flex-col space-y-1.5 p-6 md:p-8", className)} {...props} />;
}

function CardTitle({ className, ...props }) {
  return <h3 className={cn("font-serif font-normal text-xl md:text-2xl text-[#242424] tracking-tight", className)} {...props} />;
}

function CardDescription({ className, ...props }) {
  return <p className={cn("font-mono text-xs text-[#797776]", className)} {...props} />;
}

function CardContent({ className, ...props }) {
  return <div className={cn("p-6 md:p-8 pt-0", className)} {...props} />;
}

function CardFooter({ className, ...props }) {
  return <div className={cn("flex items-center p-6 md:p-8 pt-0", className)} {...props} />;
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
