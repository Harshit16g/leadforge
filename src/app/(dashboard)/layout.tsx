"use client";

import React from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { DashboardTopNav } from "@/components/layout/DashboardTopNav";
import { DashboardFiltersProvider } from "@/contexts/DashboardFilters";
import { ConfirmProvider } from "@/contexts/ConfirmContext";
import { useAuth } from "@/contexts/AuthContext";
import { getAvatarFallbackUrl } from "@/lib/utils/avatar";
import { MessagingProvider } from "@/contexts/MessagingContext";
import { LeadsProvider } from "@/contexts/LeadsContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { role, user: authUser } = useAuth();

  const user = {
    name: authUser?.name || (role === 'manager' ? 'Michael Chen' : 'Sales Advisor'),
    email: authUser?.role === 'manager' ? 'michael@hsrmotors.in' : (authUser?.name ? `${authUser.name.toLowerCase().replace(" ", ".")}@hsrmotors.in` : 'sales@hsrmotors.in'),
    avatar: getAvatarFallbackUrl(authUser?.id || (role === 'manager' ? '22222222-2222-2222-2222-222222222222' : '11111111-1111-1111-1111-111111111111'))
  };

  return (
    <MessagingProvider>
    <ConfirmProvider>
    <LeadsProvider>

      <DashboardFiltersProvider>
        <div className="h-screen max-h-screen overflow-hidden bg-background text-foreground transition-colors duration-200 flex">
          {/* LEFT SIDEBAR */}
          <AppSidebar role={role === 'manager' ? 'manager' : 'sales'} />
          
          {/* MAIN WRAPPER CONTAINER */}
          <div className="flex-1 lg:pl-60 flex flex-col h-full overflow-hidden">
            {/* TOP HEADER NAVIGATION */}
            <DashboardTopNav user={user} businessName="HSR Motors" />

            {/* SCROLLABLE MAIN BODY */}
            <main className="flex-1 overflow-hidden p-6 md:p-8 bg-background transition-colors duration-200 flex flex-col">
              {children}
            </main>
          </div>
        </div>
      </DashboardFiltersProvider>

    </LeadsProvider>
    </ConfirmProvider>
    </MessagingProvider>
  );
}
