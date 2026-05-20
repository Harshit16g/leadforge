import { createClient } from "@/utils/supabase/server";
import { TasksBoard } from "@/components/tasks/TasksBoard";
import RoleGuard from "@/components/auth/RoleGuard";
import { runLeadAutomationRules } from "@/app/actions/leads";

export default async function TasksPage() {
  // Execute background workflow automation rules before querying active lists
  await runLeadAutomationRules().catch(console.error);

  const supabase = await createClient();

  // Fetch checklist tasks and lead files concurrently
  const [tasksRes, leadsRes] = await Promise.all([
    supabase
      .from('tasks')
      .select('*, leads(name, email, phone, business_name, archived)')
      .order('created_at', { ascending: false }),
    supabase
      .from('leads')
      .select('*')
      .eq('archived', false)
      .order('created_at', { ascending: false })
  ]);

  const rawTasks = tasksRes.data || [];
  const tasks = rawTasks.filter((t: any) => !t.leads || t.leads.archived === false);
  const leads = leadsRes.data || [];

  return (
    <RoleGuard allowedRoles={['sales', 'manager']}>
      <div className="flex-1 h-full max-h-full overflow-hidden flex flex-col space-y-6">
        <div className="shrink-0">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Tasks</h1>
          <p className="text-muted-foreground mt-1 font-medium">Manage your daily follow-ups and action items.</p>
        </div>
        
        <div className="flex-1 min-h-0">
          <TasksBoard initialTasks={tasks} initialLeads={leads} />
        </div>
      </div>
    </RoleGuard>
  );
}
