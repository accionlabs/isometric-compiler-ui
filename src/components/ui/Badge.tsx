import React from "react";
import { cn } from "@/lib/utils"; // Ensure you have a utility function for class concatenation

type BadgeProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "secondary" | "danger" | "success";
};

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = "default",
  children,
  ...props
}) => {
  const variants = {
    default: "bg-gray-200 text-gray-800",
    secondary: "bg-gray-700 text-white",
    danger: "bg-red-500 text-white",
    success: "bg-green-500 text-white"
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
