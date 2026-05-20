import { createClient } from "@/utils/supabase/server";
import RoleGuard from "@/components/auth/RoleGuard";
import { LedgerTable } from "@/components/ledger/LedgerTable";
import { BookOpen } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LedgerPage() {
  const supabase = await createClient();

  const { data: entries, error } = await supabase
    .from('leads')
    .select(`
      id,
      name,
      email,
      phone,
      business_name,
      source,
      status,
      score,
      health,
      notes,
      created_at,
      archived_at,
      archived_by,
      assigned_to
    `)
    .eq('archived', true)
    .order('archived_at', { ascending: false });

  if (error) {
    console.error("Error fetching ledger:", error);
  }

  const ledgerEntries = entries || [];

  return (
    <RoleGuard allowedRoles={['manager']}>
      <div className="flex-1 h-full max-h-full overflow-hidden flex flex-col space-y-0 w-full">
        
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-1 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <BookOpen className="size-5 text-amber-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Accounts Ledger</h1>
              <p className="text-sm text-muted-foreground font-medium">
                Permanent record of converted and closed leads — {ledgerEntries.length} entries
              </p>
            </div>
          </div>
        </div>

        {/* Main Table */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <LedgerTable initialEntries={ledgerEntries} />
        </div>

      </div>
    </RoleGuard>
  );
}
