import { useState, useCallback } from "react";

export interface OnboardingData {
  organization?: {
    name?: string;
    legal_name?: string;
    org_type?: string;
    industry_type?: string;
    tagline?: string;
    logo_preview?: string;
    logo_file_name?: string;
    gst_number?: string;
    website?: string;
    description?: string;
    contact_phone?: string;
    contact_email?: string;
  };
  branch?: {
    name?: string;
    contact_phone?: string;
    contact_email?: string;
    manager_type?: "self" | "dedicated";
    manager_name?: string;
    manager_email?: string;
    manager_phone?: string;
  };
  location?: {
    address?: string;
    address_line2?: string;
    landmark?: string;
    city?: string;
    state?: string;
    pincode?: string;
    latitude?: number;
    longitude?: number;
    maps_url?: string;
    operatingHours?: Record<string, { open: string; close: string; closed: boolean }>;
  };
  services?: Array<{
    id: string;
    name: string;
    price: number;
    duration: number;
    category?: string;
  }>;
  team?: Array<{
    id: string;
    name: string;
    role: string;
    services: string[];
    phone?: string;
  }>;
  plan?: string | { id: string; [key: string]: any };
}

export function useOnboarding(initialStep: number = 0, initialData: OnboardingData = {}) {
  const [step, setStep] = useState(initialStep);
  const [data, setData] = useState<OnboardingData>(initialData);

  const updateData = useCallback((newData: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...newData }));
  }, []);

  const next = useCallback(() => setStep((s) => s + 1), []);
  const back = useCallback(() => setStep((s) => Math.max(0, s - 1)), []);

  return { step, data, updateData, next, back, setStep, setData };
}
