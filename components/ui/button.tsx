import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  href?: string;
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "icon";
}

export function Button({
  href,
  variant = "default",
  size = "default",
  className,
  children,
  ...props
}: ButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center rounded-xl transition-colors font-medium",
    variant === "default" &&
      "bg-blue-600 text-white hover:bg-blue-500",
    variant === "ghost" &&
      "bg-transparent text-white hover:bg-white/10",
    variant === "outline" &&
      "border border-blue-600 text-white hover:bg-blue-600",
    size === "default" && "h-10 px-4 py-2",
    size === "icon" && "h-10 w-10",
    className
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}

export default Button;