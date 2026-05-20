import * as React from "react"
import Link from "next/link"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

export interface NavUserProps {
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

export function NavUser({
  user,
  menuItems,
}: NavUserProps) {
  const { isMobile } = useSidebar()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex items-center justify-center shrink-0 group-data-[collapsible=icon]:w-8">
                <Avatar className="h-8 w-8 rounded-lg transition-transform duration-300">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
              </div>
              <div className="flex-1 min-w-0 truncate text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-medium">{user.name}</span><br />
                <span className="truncate text-xs text-muted-foreground">{user.email}</span>
              </div>
              <span className="icon-[solar--alt-arrow-down-linear] ml-auto size-4 group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>

            {menuItems?.map((item, index) => (
              <React.Fragment key={`${item.label}-${index}`}>
                {item.separatorBefore && <DropdownMenuSeparator />}
                <DropdownMenuItem asChild={!!item.href} onClick={item.onClick}>
                  {item.href ? (
                    <Link href={item.href} className="flex items-center w-full">
                      <span className={cn(`icon-[${item.icon}] size-4 mr-2`)} />
                      {item.label}
                    </Link>
                  ) : (
                    <div className="flex items-center w-full">
                      <span className={cn(`icon-[${item.icon}] size-4 mr-2`)} />
                      {item.label}
                    </div>
                  )}
                </DropdownMenuItem>
              </React.Fragment>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}