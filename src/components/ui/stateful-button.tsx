"use client";
import { cn } from "@/lib/utils";
import React from "react";
import { motion, AnimatePresence, useAnimate } from "framer-motion";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  children: React.ReactNode;
  variant?: "primary" | "outline" | "secondary" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg" | "xl";
}

export const StatefulButton = ({ 
  className, 
  children, 
  variant = "primary",
  size = "md",
  ...props 
}: ButtonProps) => {
  const [scope, animate] = useAnimate();

  const variantStyles = {
    primary: "bg-primary text-white hover:ring-primary",
    outline: "bg-transparent border-2 border-primary/20 text-primary hover:bg-primary/5",
    secondary: "bg-secondary text-secondary-foreground hover:ring-secondary",
    ghost: "bg-transparent text-muted-foreground hover:bg-muted",
    destructive: "bg-destructive text-destructive-foreground hover:ring-destructive",
  };

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs min-w-[100px]",
    md: "px-4 py-2 text-sm min-w-[120px]",
    lg: "px-6 py-3 text-base min-w-[140px]",
    xl: "px-8 py-4 text-lg min-w-[160px]",
  };

  const animateLoading = async () => {
    await animate(
      ".loader",
      {
        width: "20px",
        scale: 1,
        display: "block",
      },
      {
        duration: 0.2,
      },
    );
  };

  const animateSuccess = async () => {
    await animate(
      ".loader",
      {
        width: "0px",
        scale: 0,
        display: "none",
      },
      {
        duration: 0.2,
      },
    );
    await animate(
      ".check",
      {
        width: "20px",
        scale: 1,
        display: "block",
      },
      {
        duration: 0.2,
      },
    );

    await animate(
      ".check",
      {
        width: "0px",
        scale: 0,
        display: "none",
      },
      {
        delay: 2,
        duration: 0.2,
      },
    );
  };

  const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    await animateLoading();
    await props.onClick?.(event);
    await animateSuccess();
  };

  const {
    onClick,
    onDrag,
    onDragStart,
    onDragEnd,
    onAnimationStart,
    onAnimationEnd,
    ...buttonProps
  } = props;

  return (
    <motion.button
      layout
      ref={scope}
      className={cn(
        "flex cursor-pointer items-center justify-center gap-2 rounded-full font-medium ring-offset-2 transition duration-200 hover:ring-2 dark:ring-offset-black",
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...buttonProps}
      onClick={handleClick}
    >
      <motion.div layout className="flex items-center gap-2">
        <Loader />
        <CheckIcon />
        <motion.span layout>{children}</motion.span>
      </motion.div>
    </motion.button>
  );
};

const Loader = () => {
  return (
    <motion.svg
      animate={{
        rotate: [0, 360],
      }}
      initial={{
        scale: 0,
        width: 0,
        display: "none",
      }}
      style={{
        scale: 0.5,
        display: "none",
      }}
      transition={{
        duration: 0.3,
        repeat: Infinity,
        ease: "linear",
      }}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="loader"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M12 3a9 9 0 1 0 9 9" />
    </motion.svg>
  );
};

const CheckIcon = () => {
  return (
    <motion.svg
      initial={{
        scale: 0,
        width: 0,
        display: "none",
      }}
      style={{
        scale: 0.5,
        display: "none",
      }}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="check"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
      <path d="M9 12l2 2l4 -4" />
    </motion.svg>
  );
};
