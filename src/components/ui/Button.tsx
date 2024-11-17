import React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const getVariantClasses = (variant: ButtonProps['variant'] = 'default') => {
  switch (variant) {
    case 'destructive':
      return 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500';
    case 'outline':
      return 'border border-gray-600 bg-transparent hover:bg-gray-700';
    case 'secondary':
      return 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500';
    case 'ghost':
      return 'hover:bg-gray-700';
    case 'link':
      return 'text-blue-600 underline-offset-4 hover:underline';
    default:
      return 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500';
  }
};

const getSizeClasses = (size: ButtonProps['size'] = 'default') => {
  switch (size) {
    case 'sm':
      return 'px-1.5 py-1.5 text-xs';
    case 'lg':
      return 'px-4 py-3 text-base';
    case 'icon':
      return 'h-8 w-8';
    default:
      return 'px-2 py-2';
  }
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'default',
    size = 'default',
    asChild = false, 
    disabled, 
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2",
          getVariantClasses(variant),
          getSizeClasses(size),
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
        ref={ref}
        disabled={disabled}
        {...props}
      />
    )
  }
)

Button.displayName = "Button"

// Export a simpler buttonVariants function for use in other components
export const buttonVariants = ({
  variant = 'default',
  size = 'default',
  className = ''
}: Partial<ButtonProps> = {}) => {
  return cn(
    "inline-flex items-center justify-center rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2",
    getVariantClasses(variant),
    getSizeClasses(size),
    className
  )
}