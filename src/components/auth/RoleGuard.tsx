"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export default function RoleGuard({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: ('sales' | 'manager')[] }) {
  const { role } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (role === null) return; // Still loading/not set
    if (!allowedRoles.includes(role)) {
      router.push('/');
    }
  }, [role, allowedRoles, router]);

  if (role === null) return <div className="p-8">Checking permissions...</div>;
  if (!allowedRoles.includes(role)) return null;

  return <>{children}</>;
}
