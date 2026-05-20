"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <span className="icon-[solar--check-circle-linear] size-4" />,
        info: <span className="icon-[solar--info-circle-linear] size-4" />,
        warning: <span className="icon-[solar--danger-triangle-linear] size-4" />,
        error: <span className="icon-[solar--close-circle-linear] size-4" />,
        loading: <span className="icon-[solar--refresh-circle-linear] size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
