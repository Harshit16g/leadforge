"use client";

import { useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Clock, AlertTriangle, GripVertical } from "lucide-react";
import { getAvatarFallbackUrl } from "@/lib/utils/avatar";
import { REP_MAP } from "@/lib/constants/reps";
import { updateLead } from "@/app/actions/leads";
import confetti from "canvas-confetti";
import { toast } from "sonner";

const COLUMNS = [
  { id: 'new', title: 'New Leads', color: 'bg-blue-500' },
  { id: 'contacted', title: 'Contacted', color: 'bg-indigo-500' },
  { id: 'qualified', title: 'Qualified', color: 'bg-purple-500' },
  { id: 'negotiation', title: 'Negotiation', color: 'bg-amber-500' },
  { id: 'converted', title: 'Converted', color: 'bg-emerald-500' },
  { id: 'completed', title: 'Completed', color: 'bg-purple-600' },
  { id: 'lost', title: 'Lost', color: 'bg-rose-500' }
];

export function PipelineBoard({ initialLeads }: { initialLeads: any[] }) {
  const router = useRouter();
  const [leads, setLeads] = useState(initialLeads);

  const groupedLeads = COLUMNS.reduce((acc, col) => {
    acc[col.id] = leads.filter(l => l.status === col.id);
    return acc;
  }, {} as Record<string, any[]>);

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId) return; // Same column

    const newStatus = destination.droppableId;
    
    // Optimistic UI Update
    setLeads(prev => prev.map(l => 
      l.id === draggableId ? { ...l, status: newStatus } : l
    ));

    // Effects
    if (newStatus === 'completed') {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#8B5CF6', '#10B981', '#3B82F6']
      });
      toast.success("Deal finalized & completed! Lead automatically archived to the Ledger.");
    } else if (newStatus === 'converted') {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10B981', '#3B82F6', '#F59E0B']
      });
      toast.success("Lead converted! Great job.");
    } else {
      toast(`Moved to ${COLUMNS.find(c => c.id === newStatus)?.title}`);
    }

    // Backend sync
    try {
      await updateLead(draggableId, { status: newStatus });
    } catch (e) {
      toast.error("Failed to sync move with server.");
      // Revert optimism if needed (skipped for brevity)
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex-1 flex gap-6 overflow-x-auto overflow-y-hidden pb-4 items-start h-full">
        {COLUMNS.map(column => {
          const colLeads = groupedLeads[column.id] || [];
          
          return (
            <div key={column.id} className="flex-shrink-0 w-[300px] flex flex-col h-full max-h-full">
              <div className="flex items-center justify-between mb-4 px-1 playbook-column-header pb-2 transition-colors duration-200 shrink-0">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full", column.color)} />
                  {column.title}
                </h3>
                <span className="text-xs font-bold text-muted-foreground bg-card border border-border px-2 py-0.5 rounded-full shadow-sm">
                  {colLeads.length}
                </span>
              </div>
              
              <Droppable droppableId={column.id} ignoreContainerClipping={true}>
                {(provided, snapshot) => (
                  <div 
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={cn(
                      "flex-1 overflow-y-auto space-y-3 min-h-[150px] rounded-xl transition-colors p-1.5 pr-1 scrollbar-thin",
                      snapshot.isDraggingOver ? "bg-muted/40 border border-dashed border-border" : ""
                    )}
                  >
                    {colLeads.map((lead: any, index: number) => {
                      const intent = lead.health === 'hot' || lead.score > 70 ? 'Hot' : lead.score > 40 ? 'Warm' : 'Cold';
                      const isOverdue = lead.status === 'new' && lead.score > 80;
                      
                      return (
                        <Draggable key={lead.id} draggableId={lead.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              onClick={() => router.push(`/leads/${lead.id}`)}
                              className={cn(
                                "bg-card border border-border rounded-xl p-4 shadow-sm relative overflow-hidden group cursor-pointer hover:border-blue-500/40 transition-all",
                                snapshot.isDragging ? "shadow-xl shadow-blue-500/10 rotate-2 scale-105 z-50 ring-2 ring-blue-500 cursor-grabbing" : "hover:shadow-md hover:-translate-y-0.5 transition-all"
                              )}
                            >
                              <div className={cn("absolute top-0 left-0 right-0 h-1", 
                                lead.status === 'new' ? 'bg-blue-500' : 
                                lead.status === 'negotiation' ? 'bg-amber-500' :
                                lead.status === 'converted' ? 'bg-emerald-500' :
                                lead.status === 'completed' ? 'bg-purple-600' :
                                isOverdue ? 'bg-rose-500' : 'bg-transparent'
                              )} />

                              <div className="flex items-start justify-between mb-3 mt-1 gap-2">
                                <span className="font-bold text-foreground group-hover:text-blue-500 transition-colors leading-tight">
                                  {lead.name}
                                </span>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <div className={cn("px-2 py-0.5 rounded text-[10px] font-bold tracking-wider", 
                                    intent === 'Hot' ? 'bg-orange-500/15 text-orange-500 border border-orange-500/20' :
                                    intent === 'Warm' ? 'bg-blue-500/15 text-blue-500 border border-blue-500/20' : 'bg-muted text-muted-foreground border border-border'
                                  )}>
                                    {lead.score}
                                  </div>
                                  <div 
                                    {...provided.dragHandleProps}
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-1 text-muted-foreground/60 hover:text-foreground hover:bg-muted rounded cursor-grab active:cursor-grabbing transition-colors"
                                    title="Drag to reposition lead status"
                                  >
                                    <GripVertical className="size-4 shrink-0" />
                                  </div>
                                </div>
                              </div>

                              {(() => {
                                let vehicleModel = '';
                                let displayNotes = '';
                                try {
                                  if (lead.notes && lead.notes.startsWith('{')) {
                                    const parsed = JSON.parse(lead.notes);
                                    vehicleModel = parsed.vehicle || '';
                                    displayNotes = parsed.notes || '';
                                  } else {
                                    displayNotes = lead.notes;
                                  }
                                } catch (e) {
                                  displayNotes = lead.notes;
                                }

                                return (
                                  <div className="space-y-2 mb-4">
                                    {vehicleModel && (
                                      <div className="text-[11px] font-bold text-blue-500 bg-blue-500/10 border border-blue-500/15 rounded px-2 py-0.5 inline-flex items-center gap-1 max-w-full">
                                        <span className="shrink-0">🚘</span>
                                        <span className="truncate">{vehicleModel}</span>
                                      </div>
                                    )}
                                    <p className="text-xs font-medium text-muted-foreground truncate">
                                      {displayNotes || (vehicleModel ? 'Vehicle preferences captured' : 'Interested in SUV')}
                                    </p>
                                    <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">{lead.source}</p>
                                  </div>
                                );
                              })()}

                              <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/60">
                                <div className="flex items-center gap-1.5">
                                  <img 
                                    src={getAvatarFallbackUrl(lead.assigned_to || "sales-rep")} 
                                    alt="Sales Rep" 
                                    className="w-5 h-5 rounded-full object-cover border border-border shrink-0"
                                  />
                                  <span className="text-[11px] font-semibold text-muted-foreground">
                                    {lead.assigned_to ? (REP_MAP[lead.assigned_to] || 'Rep') : 'Unassigned'}
                                  </span>
                                </div>
                                
                                {isOverdue ? (
                                  <div className="flex items-center gap-1 text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded text-[10px] font-bold border border-rose-500/20">
                                    <AlertTriangle className="size-3" /> Overdue
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1 text-muted-foreground/70 text-[10px] font-semibold">
                                    <Clock className="size-3" /> 2h
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      )
                    })}
                    {provided.placeholder}
                    
                    {colLeads.length === 0 && !snapshot.isDraggingOver && (
                      <div className="h-24 rounded-xl border-2 border-dashed border-border bg-muted/10 flex items-center justify-center text-xs font-medium text-muted-foreground/50">
                        Drop here
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          )
        })}
      </div>
    </DragDropContext>
  );
}
