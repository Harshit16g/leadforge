"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarRail,
} from "@/components/ui/sidebar"
import { NavUser } from "@/components/common/NavUser"
import { cn } from "@/lib/utils"
import { BrandLogo } from "@/components/common/BrandLogo"

export interface SidebarNavItem {
  title: string
  url: string
  icon: string                // Full icon class (e.g., "icon-[solar--widget-2-linear]")
  badge?: string              // Optional badge text (e.g., "3")
  isActive?: boolean
  featureKey?: string         // Optional feature key to check
  items?: {
    title: string
    url: string
    featureKey?: string
  }[]
}

export interface SidebarNavGroup {
  label: string
  items: SidebarNavItem[]
}

export interface SidebarConfig {
  brand: {
    name: string              // "Leaex Admin" or "Leaex Partner"
    subtitle: string          // "Platform Management" or "Business Manager"
    href: string              // Dashboard link
  }
  groups: SidebarNavGroup[]
}

interface DashboardSidebarProps extends React.ComponentProps<typeof Sidebar> {
  config: SidebarConfig
  user: {
    name: string
    email: string
    avatar: string
  }
  menuItems?: {
    label: string
    icon: string
    onClick?: () => void
    href?: string
    separatorBefore?: boolean
  }[]
}

export function DashboardSidebar({ config, user, menuItems, ...props }: DashboardSidebarProps) {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href={config.brand.href} className="flex items-center gap-2">
                <div className="flex items-center justify-center shrink-0 group-data-[collapsible=icon]:w-8">
                  <BrandLogo variant="symbol" size="sm" className="transition-transform duration-300" />
                </div>
                <div className="flex-1 min-w-0 truncate text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-bold tracking-widest uppercase" style={{ fontFamily: 'var(--font-brand)' }}>{config.brand.name}</span><br />
                  <span className="truncate text-[10px] uppercase text-muted-foreground tracking-tighter">{config.brand.subtitle}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {config.groups.map((group) => {
          // ─── Feature Gating ─────────────────────────────────────────────────
          let hasFeature: (k: string) => boolean = () => true;
          try {
            const { useFeatures } = require("@/hooks/useFeatures");
            const features = useFeatures();
            hasFeature = features.hasFeature;
          } catch (e) {
            // Not in partner context or provider missing - allow all (admins)
          }

          const filteredItems = group.items.filter(item => !item.featureKey || hasFeature(item.featureKey));
          if (filteredItems.length === 0) return null;

          return (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {filteredItems.map((item) => {
                    const isActive = pathname.startsWith(item.url)
                    const filteredSubItems = item.items?.filter(sub => !sub.featureKey || hasFeature(sub.featureKey)) || [];

                    return (
                      <Collapsible
                        key={item.title}
                        asChild
                        defaultOpen={isActive || item.isActive}
                        className="group/collapsible"
                      >
                        <SidebarMenuItem>
                          <SidebarMenuButton asChild tooltip={item.title} isActive={isActive}>
                            <Link href={item.url}>
                              <span className={cn(item.icon, "size-4 shrink-0")} />
                              <span className="flex-1 min-w-0 truncate group-data-[collapsible=icon]:hidden">{item.title}</span>
                              {item.badge && (
                                <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-medium text-primary shrink-0 group-data-[collapsible=icon]:hidden">
                                  {item.badge}
                                </span>
                              )}
                            </Link>
                          </SidebarMenuButton>
                          {filteredSubItems.length ? (
                            <>
                              <CollapsibleTrigger asChild>
                                <SidebarMenuAction className="transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90">
                                  <span className="icon-[solar--alt-arrow-right-linear] size-4" />
                                  <span className="sr-only">Toggle</span>
                                </SidebarMenuAction>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <SidebarMenuSub>
                                  {filteredSubItems.map((subItem) => (
                                    <SidebarMenuSubItem key={subItem.title}>
                                      <SidebarMenuSubButton asChild isActive={pathname === subItem.url}>
                                        <Link href={subItem.url}>
                                          <span className="flex-1 min-w-0 truncate">{subItem.title}</span>
                                        </Link>
                                      </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                  ))}
                                </SidebarMenuSub>
                              </CollapsibleContent>
                            </>
                          ) : null}
                        </SidebarMenuItem>
                      </Collapsible>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} menuItems={menuItems} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
