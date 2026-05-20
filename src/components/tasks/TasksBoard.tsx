"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Circle, Clock, Loader2, Plus, User, ArrowUpRight, Flame, Mail, Phone, Calendar, AlertTriangle } from "lucide-react";
import { addTask, toggleTask } from "@/app/actions/leads";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function TasksBoard({ initialTasks, initialLeads }: { initialTasks: any[], initialLeads: any[] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [selectedLeadId, setSelectedLeadId] = useState(initialLeads[0]?.id || "");
  const [newTitle, setNewTitle] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("pending");

  // Keep state synchronized with server props
  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const filteredTasks = tasks.filter(t => {
    if (filter === "all") return true;
    return filter === "completed" ? t.status === "completed" : t.status === "pending";
  });

  // Urgently pending assigned leads follow-up lists
  const urgentFollowups = initialLeads.filter(l => l.status === 'new' || l.health === 'hot' || l.score >= 70);

  async function handleToggle(task: any) {
    setLoadingId(task.id);
    try {
      await toggleTask(task.lead_id, task.id, task.status);
      setTasks(prev => prev.map(t => 
        t.id === task.id ? { ...t, status: t.status === 'completed' ? 'pending' : 'completed' } : t
      ));
      toast.success("Task updated");
    } catch (err: any) {
      toast.error("Failed to update task");
    } finally {
      setLoadingId(null);
    }
  }

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || !selectedLeadId) return;
    setIsAdding(true);
    try {
      await addTask(selectedLeadId, newTitle);
      
      // Dynamically push the newly created task locally for immediate feedback
      const matchedLead = initialLeads.find(l => l.id === selectedLeadId);
      const mockTask = {
        id: Math.random().toString(),
        lead_id: selectedLeadId,
        title: newTitle,
        status: "pending",
        created_at: new Date().toISOString(),
        leads: { name: matchedLead?.name || "Customer" }
      };
      
      setTasks(prev => [mockTask, ...prev]);
      setNewTitle("");
      toast.success("Task added to lead checklist");
    } catch (err) {
      toast.error("Failed to create task");
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start h-full max-h-full overflow-hidden w-full">
      
      {/* LEFT COLUMN: ACTIVE CHEKLISKS & TASK INLINE FORM (8 cols) */}
      <div className="lg:col-span-8 space-y-6 h-full max-h-full flex flex-col overflow-hidden">
        
        {/* Inline Task Creation Form */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm shrink-0">
          <h2 className="text-base font-bold text-foreground mb-4">Quick Add Task</h2>
          <form onSubmit={handleCreateTask} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-4">
              <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Assign to Customer</label>
              <select
                value={selectedLeadId}
                onChange={e => setSelectedLeadId(e.target.value)}
                className="w-full h-10 px-3 bg-muted border-transparent focus:border-blue-500 focus:bg-card outline-none text-xs rounded-xl transition-all text-foreground cursor-pointer"
              >
                {initialLeads.map(lead => (
                  <option key={lead.id} value={lead.id}>{lead.name} ({lead.business_name || "Individual"})</option>
                ))}
              </select>
            </div>
            
            <div className="md:col-span-6">
              <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Task Description</label>
              <input
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="e.g. Schedule test drive, Call regarding quote..."
                required
                className="w-full h-10 px-3 bg-muted border border-transparent focus:border-blue-500 focus:bg-card outline-none text-xs rounded-xl transition-all text-foreground"
              />
            </div>
            
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={isAdding || !newTitle.trim()}
                className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1 shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isAdding ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4"/>}
                Create
              </button>
            </div>
          </form>
        </div>

        {/* Task List Container */}
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex-1 flex flex-col min-h-0">
          <div className="p-4 border-b border-border flex items-center justify-between shrink-0 bg-muted/10">
            <h2 className="text-base font-bold text-foreground">Interactive Checklists</h2>
            
            {/* Filter Toggle */}
            <div className="flex bg-muted p-1 rounded-lg">
              <button 
                onClick={() => setFilter("pending")}
                className={cn("px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer", filter === "pending" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
              >
                Pending
              </button>
              <button 
                onClick={() => setFilter("completed")}
                className={cn("px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer", filter === "completed" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
              >
                Completed
              </button>
              <button 
                onClick={() => setFilter("all")}
                className={cn("px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer", filter === "all" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
              >
                All
              </button>
            </div>
          </div>

          <div className="divide-y divide-border/60 flex-1 overflow-y-auto pr-1 scrollbar-thin">
            {filteredTasks.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <p className="text-sm font-semibold">No tasks found</p>
                <p className="text-xs mt-1">Add tasks above to begin listing follow-up checkpoints.</p>
              </div>
            ) : (
              filteredTasks.map((task) => {
                const isDone = task.status === "completed";
                const isLoading = loadingId === task.id;
                
                return (
                  <div key={task.id} className="p-4 flex items-center gap-4 hover:bg-muted/10 transition-colors group">
                    <button
                      onClick={() => !isLoading && handleToggle(task)}
                      disabled={isLoading}
                      className="shrink-0 p-1 text-muted-foreground/60 hover:text-blue-500 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {isLoading ? (
                        <Loader2 className="size-5 animate-spin text-blue-500" />
                      ) : isDone ? (
                        <CheckCircle2 className="size-5 text-emerald-500" />
                      ) : (
                        <Circle className="size-5" />
                      )}
                    </button>
                    
                    <div className="flex-1">
                      <p className={cn("text-sm font-medium", isDone ? "text-muted-foreground line-through" : "text-foreground")}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Link href={`/leads/${task.lead_id}`} className="text-[10px] bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded font-bold hover:underline">
                          Customer: {task.leads?.name || "Customer"}
                        </Link>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="size-3"/> {new Date(task.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: LEAD FOLLOW-UP ACTION DECK (4 cols) */}
      <div className="lg:col-span-4 space-y-6 h-full max-h-full flex flex-col overflow-hidden">
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm h-full flex flex-col overflow-hidden">
          <h2 className="text-base font-bold text-foreground mb-4 flex items-center gap-2 shrink-0">
            <Flame className="size-4 text-orange-500 animate-pulse" /> Action Required
          </h2>
          
          <div className="space-y-4 flex-1 overflow-y-auto pr-1 scrollbar-thin">
            {urgentFollowups.length === 0 ? (
              <p className="text-xs text-muted-foreground">All customer calls are currently up-to-date.</p>
            ) : (
              urgentFollowups.map(lead => (
                <div key={lead.id} className="p-3 bg-muted/20 border border-border/80 rounded-xl hover:border-blue-500/35 transition-all space-y-3 relative group">
                  <div className="flex justify-between items-start">
                    <div>
                      <Link href={`/leads/${lead.id}`} className="font-bold text-sm text-foreground hover:text-blue-500 flex items-center gap-1">
                        {lead.name} <ArrowUpRight className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                      <p className="text-[10px] text-muted-foreground font-semibold mt-0.5 uppercase tracking-wider">{lead.business_name || "Individual Buyer"}</p>
                    </div>
                    <span className={cn("px-2 py-0.5 rounded text-[9px] font-black border uppercase tracking-wider", 
                      lead.score >= 80 ? "bg-rose-500/10 text-rose-500 border-rose-500/20" : "bg-orange-500/10 text-orange-500 border-orange-500/20"
                    )}>
                      Score: {lead.score}
                    </span>
                  </div>
                  
                  <div className="flex gap-2 justify-end pt-1 border-t border-border/60">
                    <a href={`tel:${lead.phone}`} className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-blue-500 hover:bg-muted transition-colors">
                      <Phone className="size-3.5"/>
                    </a>
                    <a href={`mailto:${lead.email}`} className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-blue-500 hover:bg-muted transition-colors">
                      <Mail className="size-3.5"/>
                    </a>
                    <Link href={`/leads/${lead.id}`} className="px-3 h-8 text-[11px] font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 shadow-sm transition-colors">
                      View Lead
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
