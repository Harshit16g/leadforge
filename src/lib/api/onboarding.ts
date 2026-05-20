/**
 * Onboarding API Client
 */

export async function initOrg(name: string, orgType?: string, opts?: { legal_name?: string; email?: string; phone?: string }) {
  const res = await fetch("/api/onboarding/init-org", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, org_type: orgType }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? "Failed to create organisation");
  }
  return res.json();
}

export async function getOrgStatus() {
  const res = await fetch("/api/onboarding/init-org");
  if (!res.ok) throw new Error("Failed to fetch org status");
  return res.json() as Promise<{ org: { id: string; name: string } | null }>;
}

export async function saveStep(step: number, data: Record<string, unknown>) {
  const res = await fetch("/api/onboarding/save-step", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ step, data }),
  });
  if (!res.ok) throw new Error("Failed to save progress");
  return res.json();
}

export async function completeOnboarding(data: Record<string, unknown>) {
  const res = await fetch("/api/onboarding/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to finalize onboarding");
  return res.json();
}

export async function getOnboardingStatus() {
  const res = await fetch("/api/auth/profile-status");
  if (!res.ok) throw new Error("Failed to fetch status");
  return res.json();
}

export async function updateProfile(data: Record<string, unknown>) {
  const res = await fetch("/api/auth/complete-profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update profile");
  return res.json();
}
