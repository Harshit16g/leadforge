import { createClient } from "@/utils/supabase/server";
import { LeadsTable } from "@/components/leads/LeadsTable";
import { AddLeadDialog } from "@/components/leads/AddLeadDialog";
import RoleGuard from "@/components/auth/RoleGuard";
import { AlertTriangle, Sparkles, Calendar, ArrowUpRight, Car, AlertCircle, CheckCircle2 } from "lucide-react";
import { runLeadAutomationRules } from "@/app/actions/leads";

export default async function LeadsPage() {
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

  // Fetch dynamic upcoming scheduled test drives
  const { data: upcomingDrives } = await supabase
    .from('test_drives')
    .select('*')
    .eq('status', 'scheduled')
    .order('scheduled_at', { ascending: true })
    .limit(3);

  const upcomingDrivesList = upcomingDrives || [];

  // Compute live SLA breaches for hot/high score leads untouched for over 30 mins
  const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
  const breachedHotLeadsCount = leadsList.filter(l => 
    l.status === 'new' && 
    (l.health === 'hot' || (l.score && l.score >= 70)) && 
    l.created_at && 
    new Date(l.created_at) < thirtyMinsAgo
  ).length;

  return (
    <RoleGuard allowedRoles={['sales', 'manager']}>
      <div className="flex-1 h-full max-h-full overflow-hidden flex flex-col lg:flex-row items-start gap-6 relative w-full">
        
        {/* LEFT: MAIN WORKSPACE */}
        <div className="flex-1 h-full max-h-full overflow-hidden flex flex-col space-y-4 min-w-0 w-full pr-2">
          
          {/* HEADER */}
          <div className="flex items-end justify-between shrink-0 mb-2">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Leads</h1>
              <p className="text-sm text-muted-foreground mt-1 font-medium">Monitor, prioritize and convert incoming inquiries.</p>
            </div>
            <AddLeadDialog />
          </div>

          <LeadsTable initialLeads={leadsList} />
        </div>

        {/* RIGHT: INSIGHT PANEL */}
        <div className="w-full lg:w-[300px] flex-shrink-0 space-y-6 h-full max-h-full overflow-y-auto pb-8 pr-1 scrollbar-thin">
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-muted/40 border-b border-border/80 flex items-center gap-2">
              <AlertTriangle className="size-4 text-orange-500" />
              <h3 className="font-semibold text-sm text-foreground">Follow-up Alerts</h3>
            </div>
            <div className="p-4 space-y-3">
              {breachedHotLeadsCount > 0 ? (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg animate-pulse">
                  <p className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                    <AlertCircle className="size-4 text-rose-500" /> Response Overdue Alert
                  </p>
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 font-semibold">
                    {breachedHotLeadsCount} hot lead{breachedHotLeadsCount > 1 ? 's' : ''} untouched &gt; 30 mins!
                  </p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">Please check assignment queues immediately.</p>
                </div>
              ) : (
                <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg flex items-start gap-2.5">
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-emerald-600">Follow-up Healthy</p>
                    <p className="text-[10px] text-emerald-600/80 mt-0.5">
                      All high-priority hot leads are being serviced inside safe response goals.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-muted/40 border-b border-border/80 flex items-center gap-2">
              <Sparkles className="size-4 text-blue-500" />
              <h3 className="font-semibold text-sm text-foreground">AI Suggestions</h3>
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-1">
                <p className="text-xs font-medium text-foreground">5 customers likely to convert this week</p>
                <p className="text-[11px] text-muted-foreground">Based on recent WhatsApp intent analysis.</p>
                <button className="text-xs text-blue-500 font-bold mt-1 flex items-center gap-1 hover:underline">
                  View Cohort <ArrowUpRight className="size-3" />
                </button>
              </div>
              <div className="h-px w-full bg-border" />
              <div className="space-y-1">
                <p className="text-xs font-medium text-foreground">Potential Duplicate Detected</p>
                <p className="text-[11px] text-muted-foreground">John Doe (Website) & John D. (Facebook)</p>
                <button className="text-xs text-blue-500 font-bold mt-1 hover:underline">Review & Merge</button>
              </div>
            </div>
          </div>
          
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-muted/40 border-b border-border/80 flex items-center gap-2">
              <Calendar className="size-4 text-indigo-500" />
              <h3 className="font-semibold text-sm text-foreground">Upcoming Test Drives</h3>
            </div>
            <div className="p-4 space-y-4">
              {upcomingDrivesList.length > 0 ? (
                upcomingDrivesList.map((drive: any) => {
                  const date = new Date(drive.scheduled_at);
                  const isToday = date.toDateString() === new Date().toDateString();
                  const isTomorrow = date.toDateString() === new Date(Date.now() + 86400000).toDateString();
                  const dayLabel = isToday ? 'TODAY' : isTomorrow ? 'TOMORROW' : date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
                  const dayNum = date.getDate();
                  const timeLabel = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

                  const content = (
                    <div key={drive.id} className="flex gap-3 hover:bg-muted/30 p-1.5 rounded-lg transition-colors group">
                      <div className="flex flex-col items-center justify-center w-10 h-10 bg-indigo-500/10 rounded-lg text-indigo-500 shrink-0">
                        <span className="text-[8px] font-black uppercase tracking-wider">{dayLabel}</span>
                        <span className="text-sm font-black leading-none mt-0.5">{dayNum}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-foreground truncate group-hover:text-blue-500 transition-colors">
                          {drive.customer_name}
                        </p>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                          <Car className="size-3 shrink-0" /> {drive.car_model}
                        </p>
                        <p className="text-[9px] text-indigo-500 font-bold mt-0.5">
                          {timeLabel}
                        </p>
                      </div>
                    </div>
                  );

                  if (drive.lead_id) {
                    return (
                      <a key={drive.id} href={`/leads/${drive.lead_id}`} className="block">
                        {content}
                      </a>
                    );
                  }

                  return content;
                })
              ) : (
                <div className="p-3 bg-muted/40 border border-border/60 rounded-xl text-center">
                  <p className="text-[11px] text-muted-foreground font-semibold">No upcoming drives scheduled.</p>
                  <p className="text-[9px] text-muted-foreground/80 mt-0.5">Book sessions via lead action panels.</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </RoleGuard>
  );
}
