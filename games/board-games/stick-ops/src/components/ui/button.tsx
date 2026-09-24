import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium tracking-wide transition-colors duration-150 ease-out disabled:pointer-events-none disabled:opacity-40 select-none",
  {
    variants: {
      variant: {
        primary:
          "bg-accent text-accent-fg hover:bg-accent/90 active:scale-[0.98]",
        secondary:
          "bg-surface-2 text-fg border border-border hover:border-fg/25 hover:bg-surface",
        ghost: "text-fg hover:bg-fg/6",
        outline:
          "border border-border text-fg hover:border-fg/30 hover:bg-fg/4",
        danger: "bg-danger text-fg hover:bg-danger/90",
      },
      size: {
        sm: "h-10 px-3.5 text-sm rounded-[10px]",
        md: "h-12 px-5 text-sm rounded-md",
        lg: "h-14 px-7 text-[15px] rounded-lg",
        icon: "size-11 rounded-md",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}
