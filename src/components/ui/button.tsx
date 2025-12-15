import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-body font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-soft hover:bg-primary/90 hover:shadow-gentle active:scale-[0.98]",
        destructive:
          "bg-amber text-foreground shadow-soft hover:bg-amber/90",
        outline:
          "border-2 border-border bg-background hover:bg-secondary hover:border-primary/30",
        secondary:
          "bg-secondary text-secondary-foreground shadow-soft hover:bg-secondary/80",
        ghost: "hover:bg-secondary hover:text-secondary-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // SafeTalk-specific variants - calm and supportive
        entry:
          "bg-card text-foreground border border-border shadow-soft hover:shadow-gentle hover:border-primary/30 hover:bg-sage-light active:scale-[0.98] text-left justify-start h-auto py-5 px-6 rounded-3xl",
        voice:
          "bg-primary text-primary-foreground shadow-gentle hover:shadow-card hover:scale-[1.02] active:scale-100 rounded-full",
        quick:
          "bg-sage-light text-foreground border border-primary/20 hover:border-primary/40 rounded-full text-small py-2.5 px-5",
        exit:
          "bg-muted text-muted-foreground hover:bg-secondary fixed top-4 right-4 z-50 rounded-full p-2.5 shadow-soft",
        // Emergency variant - uses amber, not red
        emergency:
          "bg-amber-light text-foreground border border-amber/30 hover:border-amber/50 hover:shadow-gentle active:scale-[0.98]",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 rounded-xl px-4 text-small",
        lg: "h-14 rounded-2xl px-8 text-body",
        xl: "h-16 rounded-3xl px-10 text-subhead",
        icon: "h-12 w-12",
        "icon-lg": "h-16 w-16",
        "icon-xl": "h-24 w-24",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
