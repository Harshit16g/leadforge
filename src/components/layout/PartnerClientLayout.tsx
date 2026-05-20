"use client";

import { FeaturesProvider } from "@/hooks/useFeatures";
import { useBootstrap } from "@/hooks/useBootstrap";
import { BootstrapScreen } from "@/components/system/BootstrapScreen";

export function PartnerClientLayout({ 
  children,
  role = 'partner'
}: { 
  children: React.ReactNode,
  role?: 'partner' | 'employee' | 'admin' | 'customer'
}) {
  const { stage, isReady } = useBootstrap();
  console.log('[PARTNER_LAYOUT] isReady:', isReady, 'stage:', stage);

  if (!isReady) {
    return <BootstrapScreen stage={stage} role={role} />;
  }

  return (
    <FeaturesProvider>
      <div className="min-h-screen flex flex-col animate-in fade-in duration-500">
        {children}
      </div>
    </FeaturesProvider>
  );
}
