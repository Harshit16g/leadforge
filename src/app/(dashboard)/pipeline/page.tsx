import { createClient } from "@/utils/supabase/server";
import { Sparkles, Download, Users, Shuffle } from "lucide-react";
import { PipelineBoard } from "@/components/pipeline/PipelineBoard";
import RoleGuard from "@/components/auth/RoleGuard";
import { runLeadAutomationRules } from "@/app/actions/leads";

export default async function PipelinePage() {
  // Execute background workflow automation rules before querying the active list
  await runLeadAutomationRules().catch(console.error);

  const supabase = await createClient();
  const { data: leads, error } = await supabase
    .from('leads')
    .select('*')
    .eq('archived', false)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching leads:", error);
  }

  const leadsList = leads || [];

  return (
    <RoleGuard allowedRoles={['sales', 'manager']}>
      <div className="flex-1 h-full max-h-full overflow-hidden flex flex-col space-y-6">
        
        {/* Header & Toolbar */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Pipeline</h1>
            <p className="text-sm font-medium text-muted-foreground mt-1">Drag and drop leads to update their status.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="h-9 px-4 rounded-lg bg-card border border-border text-foreground font-medium text-sm flex items-center gap-2 hover:bg-muted shadow-sm transition-colors">
              <Shuffle className="size-4" /> Auto-route
            </button>
            <button className="h-9 px-4 rounded-lg bg-card border border-border text-foreground font-medium text-sm flex items-center gap-2 hover:bg-muted shadow-sm transition-colors">
              <Users className="size-4" /> Bulk assign
            </button>
            <button className="h-9 px-4 rounded-lg bg-card border border-border text-foreground font-medium text-sm flex items-center gap-2 hover:bg-muted shadow-sm transition-colors">
              <Download className="size-4" /> Export
            </button>
            <button className="h-9 px-4 rounded-lg bg-blue-600 text-white font-medium text-sm flex items-center gap-2 hover:bg-blue-700 shadow-sm transition-colors">
              <Sparkles className="size-4 text-blue-200" /> AI Insights
            </button>
          </div>
        </div>

        <PipelineBoard initialLeads={leadsList} />
      </div>
    </RoleGuard>
  )
}
