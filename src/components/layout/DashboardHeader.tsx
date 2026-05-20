"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { useBeacon } from "@/components/providers/BeaconProvider"


interface DashboardHeaderProps {
  title?: string
  className?: string
  actions?: React.ReactNode
}

export function DashboardHeader({
  title,
  className,
  actions,
}: DashboardHeaderProps) {
  const pathname = usePathname()
  const pathSegments = pathname.split("/").filter(Boolean)
  const beacon = useBeacon();

  React.useEffect(() => {
    beacon.session.start();
    beacon.human.welcome(); // Informational acknowledgment on dashboard entry
  }, []);


  // Generate breadcrumbs from pathname
  const breadcrumbs = pathSegments.map((segment, index) => {
    const href = `/${pathSegments.slice(0, index + 1).join("/")}`
    const label = segment
      .replace(/-/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase())
    const isLast = index === pathSegments.length - 1

    return {
      href,
      label,
      isLast,
    }
  })

  return (
    <header
      className={cn(
        "flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4 transition-[width,height] ease-linear",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        {title ? (
          <h1 className="text-sm font-semibold">{title}</h1>
        ) : (
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={crumb.href}>
                  <BreadcrumbItem className={cn(index === 0 && "hidden md:block")}>
                    {crumb.isLast ? (
                      <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {!crumb.isLast && (
                    <BreadcrumbSeparator className={cn(index === 0 && "hidden md:block")} />
                  )}
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        )}
      </div>
      <div className="flex items-center gap-2 pr-4">
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
        <ThemeToggle />
      </div>
    </header>
  )
}
