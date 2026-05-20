import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { StatusBadge, StatusVariant } from "@/components/common/StatusBadge";
import { ArrowLeft, Phone, Mail, Calendar, User, Briefcase, Activity, MapPin, Tag, Sparkles, AlertCircle, Users, CheckCircle2, ChevronRight, MessageSquare, PhoneCall, Plus } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { AddInteractionForm } from "@/components/leads/AddInteractionForm";
import { getAvatarFallbackUrl } from "@/lib/utils/avatar";
import { ChecklistPanel } from "@/components/leads/ChecklistPanel";
import { WinningPitchesDialog } from "@/components/leads/WinningPitchesDialog";
import { AiInsightsPanel } from "@/components/leads/AiInsightsPanel";
import { LeadStageControl } from "@/components/leads/LeadStageControl";
import { SpecialNotesEditor } from "@/components/leads/SpecialNotesEditor";
import { LeadActionPanel } from "@/components/leads/LeadActionPanel";
import { LeadProfilePanel } from "@/components/leads/LeadProfilePanel";

export default async function LeadDetailsPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { id } = await params;

  const { data: lead, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !lead) {
    notFound();
  }

  // Fetch interactions and tasks in parallel to minimize network latency overhead
  const [interactionsRes, dbTasksRes] = await Promise.all([
    supabase
      .from('interactions')
      .select('*')
      .eq('lead_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('tasks')
      .select('*')
      .eq('lead_id', id)
      .order('created_at', { ascending: true })
  ]);

  const interactions = interactionsRes.data || [];
  let dbTasks = dbTasksRes.data || [];

  // Seed standard extended checklist dynamically inside Supabase directly to avoid Next.js Render Action error
  if (dbTasks.length === 0) {
    const defaultTasks = [
      { lead_id: id, title: 'Send brochure & pricing', status: 'pending' },
      { lead_id: id, title: 'Arrange callback with finance', status: 'pending' },
      { lead_id: id, title: 'Schedule test drive', status: 'pending' },
      { lead_id: id, title: 'Follow up after test drive', status: 'pending' },
      { lead_id: id, title: 'Negotiate final pricing', status: 'pending' },
      { lead_id: id, title: 'Collect booking amount', status: 'pending' }
    ];
    const { data: seeded } = await supabase.from('tasks').insert(defaultTasks).select();
    dbTasks = seeded || [];
  }

  // Custom metadata parsing from notes JSON to keep the schema fully flexible
  let notesText = lead.notes || '';
  let vehicle = 'Hyundai i20 Asta';
  let budget = '₹8L - ₹11L';
  let fuel = 'Petrol';
  let financing = 'Needs Assistance';
  let location = 'Bengaluru, KA';
  let tags = ['SUV Buyer', 'High Urgency', 'Financing Likely'];

  try {
    if (lead.notes && lead.notes.trim().startsWith('{')) {
      const meta = JSON.parse(lead.notes);
      vehicle = meta.vehicle || vehicle;
      budget = meta.budget || budget;
      fuel = meta.fuel || fuel;
      financing = meta.financing || financing;
      location = meta.location || location;
      notesText = meta.notes || '';
      if (meta.tags) {
        tags = Array.isArray(meta.tags) ? meta.tags : typeof meta.tags === 'string' ? meta.tags.split(',').map((t: string) => t.trim()) : tags;
      }
    } else {
      // Legacy note checks
      vehicle = lead.notes?.includes('SUV') ? 'Hyundai Creta SX (O)' : lead.notes?.includes('fleet') ? 'Multiple Fleet' : 'Hyundai i20 Asta';
      budget = vehicle.includes('Creta') ? '₹14L - ₹18L' : '₹8L - ₹11L';
      fuel = vehicle.includes('Creta') ? 'Diesel' : 'Petrol';
      financing = lead.notes?.includes('finance') ? 'Pre-approved' : 'Needs Assistance';
      location = 'Bengaluru, KA';
    }
  } catch (e) {
    // Fallback if parsing fails
  }

  // Calculate SLA Pill
  const contactInteractions = interactions.filter(
    (i: any) => i.type === 'call' || i.type === 'email' || i.type === 'meeting'
  );
  const isResponded = contactInteractions.length > 0;
  let slaPill = null;
  
  if (isResponded) {
    const sorted = [...contactInteractions].sort(
      (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    const firstContact = sorted[0];
    const responseTime = Math.max(0, Math.floor(
      (new Date(firstContact.created_at).getTime() - new Date(lead.created_at).getTime()) / 60000
    ));
    slaPill = (
      <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full text-xs font-bold shadow-sm flex-shrink-0">
        <CheckCircle2 className="size-3.5" />
        <span>SLA Achieved: {responseTime}m</span>
      </div>
    );
  } else {
    const elapsed = Math.floor((Date.now() - new Date(lead.created_at).getTime()) / 60000);
    const isBreached = elapsed >= 15;
    const remaining = 15 - elapsed;
    slaPill = (
      <div className={cn(
        "flex items-center gap-1.5 px-3 py-1 border rounded-full text-xs font-bold shadow-sm flex-shrink-0",
        isBreached ? "bg-rose-500/10 text-rose-500 border-rose-500/20" : "bg-orange-500/10 text-orange-500 border-orange-500/20"
      )}>
        {isBreached ? <AlertCircle className="size-3.5" /> : <Activity className="size-3.5 animate-pulse" />}
        <span>{isBreached ? `SLA Overdue: ${elapsed - 15}m` : `SLA: ${remaining}m left`}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-138px)] space-y-0 overflow-hidden select-none">
      {/* Grid Container */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-0 overflow-hidden select-text">
        
        {/* LEFT COLUMN — PROFILE (3 cols) */}
        <div className="lg:col-span-3 flex flex-col gap-4 h-full overflow-hidden min-h-0 pr-1">
          <LeadProfilePanel 
            lead={lead} 
            initialMeta={{ vehicle, budget, fuel, financing, location, notesText, tags }} 
          />
          
          <SpecialNotesEditor leadId={lead.id} rawNotes={lead.notes || ''} />
        </div>

        {/* CENTER COLUMN — TIMELINE (6 cols) */}
        <div className="lg:col-span-6 bg-card border border-border rounded-2xl shadow-sm flex flex-col h-full overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between bg-card rounded-t-2xl z-10">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <MessageSquare className="size-4 text-muted-foreground" /> Interaction Timeline
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-muted/10">
            {!interactions || interactions.length === 0 ? (
              <div className="space-y-6 relative">
                <div className="absolute left-5 top-2 bottom-0 w-px bg-border" />
                <div className="relative flex gap-4">
                  <div className="w-10 h-10 bg-card border-2 border-emerald-500/20 rounded-full flex items-center justify-center flex-shrink-0 z-10 text-emerald-500 shadow-sm">
                    <Sparkles className="size-4" />
                  </div>
                  <div className="flex-1 pt-2">
                    <p className="text-sm font-medium text-foreground">Lead generated via <span className="capitalize">{lead.source}</span></p>
                    <p className="text-xs text-muted-foreground">{new Date(lead.created_at).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-5 top-2 bottom-0 w-px bg-border" />
                <div className="space-y-6">
                  {interactions.map((interaction: any) => {
                    const isCall = interaction.type === 'call';
                    const Icon = isCall ? PhoneCall : MessageSquare;
                    return (
                      <div key={interaction.id} className="relative flex gap-4 group">
                        <div className={cn("w-10 h-10 bg-card border-2 rounded-full flex items-center justify-center flex-shrink-0 z-10 shadow-sm transition-colors", 
                          isCall ? "border-blue-500/20 text-blue-500 group-hover:border-blue-500/35" : "border-border text-muted-foreground group-hover:border-border/80"
                        )}>
                          <Icon className="size-4" />
                        </div>
                        <div className="flex-1 bg-card border border-border rounded-xl p-4 shadow-sm group-hover:shadow transition-shadow">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-sm text-foreground capitalize">{interaction.type}</span>
                            <span className="text-[11px] font-medium text-muted-foreground">{new Date(interaction.created_at).toLocaleString()}</span>
                          </div>
                          <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{interaction.content}</p>
                        </div>
                      </div>
                    );
                  })}

                  <div className="relative flex gap-4">
                    <div className="w-10 h-10 bg-card border-2 border-emerald-500/20 rounded-full flex items-center justify-center flex-shrink-0 z-10 text-emerald-500 shadow-sm">
                      <Sparkles className="size-4" />
                    </div>
                    <div className="flex-1 pt-2">
                      <p className="text-sm font-medium text-foreground">Lead generated via <span className="capitalize">{lead.source}</span></p>
                      <p className="text-xs text-muted-foreground">{new Date(lead.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-card border-t border-border rounded-b-2xl">
            <AddInteractionForm leadId={lead.id} />
          </div>
        </div>

        {/* RIGHT COLUMN — AI & TASKS (3 cols) */}
        <div className="lg:col-span-3 flex flex-col gap-4 h-full overflow-hidden min-h-0 pl-1">
          
          {/* Stage Controller */}
          <LeadStageControl leadId={lead.id} currentStatus={lead.status} />

          {/* Transfer & Reassign Action Strip */}
          <LeadActionPanel 
            leadId={lead.id} 
            leadName={lead.name}
            leadCreatedAt={lead.created_at} 
            interactions={interactions || []} 
          />

          {/* Checklist Panel */}
          <ChecklistPanel leadId={lead.id} initialTasks={dbTasks || []} />

          {/* AI Insights Panel */}
          <AiInsightsPanel lead={lead} interactions={interactions || []} />
          
          {/* Similar Conversions */}
          <div className="bg-card border border-border rounded-xl shadow-sm p-4 flex-shrink-0">
            <h3 className="font-semibold text-sm text-foreground mb-2 flex items-center gap-2">
              <Users className="size-4 text-muted-foreground" /> Similar Conversions
            </h3>
            <p className="text-xs text-muted-foreground leading-normal">
              Customers with similar profiles frequently purchased <span className="font-semibold text-foreground">Kia Seltos</span> or <span className="font-semibold text-foreground">Creta SX</span>.
            </p>
            <WinningPitchesDialog vehicle={vehicle} financing={financing} budget={budget} />
          </div>
        </div>

      </div>
    </div>
  )
}
