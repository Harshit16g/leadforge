"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Search, 
  Phone, 
  Mail, 
  Clock, 
  UserPlus, 
  Flame, 
  TrendingUp, 
  Users, 
  Send,
  Loader2,
  CheckCircle2,
  X
} from "lucide-react";
import { getAvatarFallbackUrl } from "@/lib/utils/avatar";
import { SALES_REPS, REP_MAP } from "@/lib/constants/reps";
import { StatusBadge, StatusVariant } from "@/components/common/StatusBadge";
import { EditLeadDialog } from "@/components/leads/EditLeadDialog";
import { ClickableRow } from "@/components/leads/ClickableRow";
import { bulkUpdateLeads, archiveLeads } from "@/app/actions/leads";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Archive } from "lucide-react";
import { SlaTimer } from "@/components/leads/SlaTimer";

export function LeadsTable({ initialLeads }: { initialLeads: any[] }) {
  const { user: currentUser } = useAuth();
  const [leads, setLeads] = useState(initialLeads);
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [scoreFilter, setScoreFilter] = useState("all");

  // Selection States
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [chosenRepId, setChosenRepId] = useState(SALES_REPS[0].id);
  
  // Sharing States
  const [shareRepId, setShareRepId] = useState(SALES_REPS[0].id);
  const [shareNote, setShareNote] = useState("");
  const [activeTab, setActiveTab] = useState<"reassign" | "share" | "archive">("reassign");

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Keep state perfectly synchronized with updated server props
  useEffect(() => {
    setLeads(initialLeads);
  }, [initialLeads]);

  // Handle dynamic real-time filtering and sorting
  const filteredLeads = useMemo(() => {
    let result = leads.filter(lead => {
      const matchesSearch = 
        lead.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.business_name?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSource = sourceFilter === "all" || lead.source?.toLowerCase() === sourceFilter.toLowerCase();
      const matchesStatus = statusFilter === "all" || lead.status?.toLowerCase() === statusFilter.toLowerCase();
      
      let matchesScore = true;
      if (scoreFilter === "hot") {
        matchesScore = lead.score >= 70;
      } else if (scoreFilter === "warm") {
        matchesScore = lead.score >= 40 && lead.score < 70;
      } else if (scoreFilter === "cold") {
        matchesScore = lead.score < 40;
      }

      return matchesSearch && matchesSource && matchesStatus && matchesScore;
    });

    // If no active filters, sort by "latest contacted" (last_interaction_at || created_at)
    const hasNoFilters = searchQuery === "" && sourceFilter === "all" && statusFilter === "all" && scoreFilter === "all";
    if (hasNoFilters) {
      result = [...result].sort((a, b) => {
        const timeA = new Date(a.last_interaction_at || a.created_at).getTime();
        const timeB = new Date(b.last_interaction_at || b.created_at).getTime();
        return timeB - timeA; // descending
      });
    }

    return result;
  }, [leads, searchQuery, sourceFilter, statusFilter, scoreFilter]);

  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sourceFilter, statusFilter, scoreFilter]);

  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLeads.slice(start, start + itemsPerPage);
  }, [filteredLeads, currentPage]);

  // Calculate dynamic stateful stats based on filtered leads list
  const newLeadsCount = filteredLeads.filter((l: any) => l.status === 'new').length;
  const hotLeadsCount = filteredLeads.filter((l: any) => l.health === 'hot' || l.score >= 70).length;
  const pendingCount = filteredLeads.filter((l: any) => l.status === 'contacted' || l.status === 'qualified').length;
  
  const converted = filteredLeads.filter((l: any) => l.status === 'converted').length;
  const conversionRate = filteredLeads.length ? Math.round((converted / filteredLeads.length) * 100) : 0;

  // Toggle selection for a single lead
  function handleToggleLead(leadId: string) {
    setSelectedLeadIds(prev => 
      prev.includes(leadId) ? prev.filter(id => id !== leadId) : [...prev, leadId]
    );
  }

  // Toggle select/deselect all filtered leads
  function handleToggleAll() {
    const allFilteredIds = filteredLeads.map(l => l.id);
    const areAllSelected = allFilteredIds.every(id => selectedLeadIds.includes(id));
    
    if (areAllSelected) {
      // Remove all filtered leads from selection
      setSelectedLeadIds(prev => prev.filter(id => !allFilteredIds.includes(id)));
    } else {
      // Add all filtered leads to selection
      setSelectedLeadIds(prev => {
        const union = new Set([...prev, ...allFilteredIds]);
        return Array.from(union);
      });
    }
  }

  // Archive to Ledger Action (manager-only, converted/lost only)
  async function handleArchiveToLedger() {
    if (selectedLeadIds.length === 0) return;
    setBulkLoading(true);
    try {
      const result = await archiveLeads(selectedLeadIds, currentUser?.id || '');
      const msg = result.skipped > 0
        ? `Archived ${result.archived} lead(s). ${result.skipped} skipped (not converted/lost).`
        : `${result.archived} lead(s) moved to Ledger successfully.`;
      toast.success(msg);
      // Remove archived leads from local state immediately
      setLeads(prev => prev.filter(l => !selectedLeadIds.includes(l.id)));
      setSelectedLeadIds([]);
    } catch (err: any) {
      toast.error(err.message || 'Failed to archive leads');
    } finally {
      setBulkLoading(false);
    }
  }

  // Bulk Reassign Action
  async function handleBulkReassign() {
    if (selectedLeadIds.length === 0) return;
    setBulkLoading(true);
    try {
      await bulkUpdateLeads(selectedLeadIds, chosenRepId);
      toast.success(`Successfully reassigned ${selectedLeadIds.length} leads!`);
      setSelectedLeadIds([]);
    } catch (err: any) {
      toast.error(err.message || "Failed to reassign leads");
    } finally {
      setBulkLoading(false);
    }
  }

  // Bulk Share via Internal Messages Hub Action
  async function handleBulkShare() {
    if (selectedLeadIds.length === 0) return;
    setBulkLoading(true);
    try {
      const selectedDetails = leads.filter(l => selectedLeadIds.includes(l.id));
      const targetRepName = SALES_REPS.find(r => r.id === shareRepId)?.name || "Colleague";
      
      // Structure highly professional internal chat messages with active CRM links
      const leadsListMarkdown = selectedDetails.map(l => {
        return `• ${l.name} (${l.phone || "No phone"}) - View: http://localhost:3000/leads/${l.id}`;
      }).join("\n");

      const messageBody = `Hi ${targetRepName}, sharing the following ${selectedLeadIds.length} lead profiles with you for review:\n\n${leadsListMarkdown}\n\n${shareNote.trim() ? `Additional Notes: ${shareNote.trim()}` : ""}`;

      const res = await fetch("/api/partner/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageBody,
          sender_id: currentUser?.id,
          recipient_id: shareRepId,
          thread_type: "internal"
        })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to share via chat");

      toast.success(`Successfully shared ${selectedLeadIds.length} leads with ${targetRepName}!`);
      setSelectedLeadIds([]);
      setShareNote("");
    } catch (err: any) {
      toast.error(err.message || "Failed to share leads");
    } finally {
      setBulkLoading(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 select-text relative">
      
      {/* Dynamic KPI Strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0 mb-6">
        <div className="bg-card rounded-xl p-4 border border-border shadow-sm flex flex-col gap-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-sm font-semibold">New Leads</span>
            <UserPlus className="size-4 text-blue-500" />
          </div>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-bold text-foreground tabular-nums">{newLeadsCount}</span>
            <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1 bg-emerald-500/10 px-1.5 py-0.5 rounded-md"><TrendingUp className="size-3"/> +12%</span>
          </div>
        </div>
        
        <div className="bg-card rounded-xl p-4 border border-border shadow-sm flex flex-col gap-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-sm font-semibold">Hot Leads</span>
            <Flame className="size-4 text-orange-500" />
          </div>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-bold text-foreground tabular-nums">{hotLeadsCount}</span>
            <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1 bg-emerald-500/10 px-1.5 py-0.5 rounded-md"><TrendingUp className="size-3"/> +4%</span>
          </div>
        </div>
        
        <div className="bg-card rounded-xl p-4 border border-border shadow-sm flex flex-col gap-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-sm font-semibold">Pending Follow-ups</span>
            <Clock className="size-4 text-muted-foreground" />
          </div>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-bold text-foreground tabular-nums">{pendingCount}</span>
            <span className="text-xs font-semibold text-rose-500 flex items-center gap-1 bg-rose-500/10 px-1.5 py-0.5 rounded-md">Active</span>
          </div>
        </div>

        <div className="bg-card rounded-xl p-4 border border-border shadow-sm flex flex-col gap-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-sm font-semibold">Conversion Rate</span>
            <TrendingUp className="size-4 text-emerald-500" />
          </div>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-bold text-foreground tabular-nums">{conversionRate}%</span>
            <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">+2.1%</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-background/90 backdrop-blur-md py-2 -mx-1 px-1 flex flex-col md:flex-row items-start md:items-center gap-3 transition-colors duration-200 shrink-0 mb-4">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search leads..."
              className="w-full h-9 pl-9 pr-3 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm"
            />
          </div>
          
          <div className="h-5 w-px bg-border hidden md:block" />
          
          <select 
            value={sourceFilter}
            onChange={e => setSourceFilter(e.target.value)}
            className="h-9 px-3 bg-card border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors shadow-sm outline-none cursor-pointer"
          >
            <option value="all">Source: All</option>
            <option value="website">Website</option>
            <option value="google">Google</option>
            <option value="facebook">Facebook</option>
            <option value="offline">Offline</option>
          </select>
          
          <select 
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="h-9 px-3 bg-card border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors shadow-sm outline-none cursor-pointer"
          >
            <option value="all">Status: All</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="negotiation">Negotiation</option>
            <option value="converted">Converted</option>
            <option value="lost">Lost</option>
          </select>
          
          <select 
            value={scoreFilter}
            onChange={e => setScoreFilter(e.target.value)}
            className="h-9 px-3 bg-card border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors shadow-sm outline-none cursor-pointer"
          >
            <option value="all">Score: Any</option>
            <option value="hot">&gt; 70 (Hot)</option>
            <option value="warm">40 - 70 (Warm)</option>
            <option value="cold">&lt; 40 (Cold)</option>
          </select>
        </div>
      </div>

      {/* Main Table Card Wrapper */}
      <div className="flex-1 min-h-0 bg-card border border-border rounded-2xl shadow-sm flex flex-col overflow-hidden mb-6">
        <div className="flex-1 overflow-auto scrollbar-thin">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-muted/40 border-b border-border/80">
                {/* Checkbox Column Header */}
                <th 
                  className="w-12 px-5 py-3 text-center cursor-pointer hover:bg-muted/80 transition-colors relative"
                  onClick={handleToggleAll}
                >
                  <input 
                    type="checkbox" 
                    checked={filteredLeads.length > 0 && filteredLeads.every(l => selectedLeadIds.includes(l.id))}
                    onChange={() => {}} // Handled by cell onClick
                    className="rounded border-border text-blue-600 focus:ring-blue-500 accent-blue-600 size-4 cursor-pointer pointer-events-none"
                  />
                </th>
                <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Lead</th>
                <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Intent</th>
                <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Interest</th>
                <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Source</th>
                <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Assigned</th>
                <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">SLA Response</th>
                <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-sm">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-muted-foreground">
                    No leads found matching current criteria.
                  </td>
                </tr>
              ) : (
                paginatedLeads.map((lead: any) => {
                  const intent = lead.health === 'hot' || lead.score > 70 ? 'Hot' : lead.score > 40 ? 'Warm' : 'Cold';
                  const intentColor = intent === 'Hot' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : intent === 'Warm' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-muted text-muted-foreground border-border';
                  
                  // Deterministic fallback sales rep assignment matching to avoid empty unassigned fields
                  const repIndex = Math.abs(lead.id.split('-').reduce((acc: number, part: string) => acc + parseInt(part, 16) || 0, 0)) % SALES_REPS.length;
                  const assignedRepName = lead.assigned_to ? (REP_MAP[lead.assigned_to] || 'Sarah Jenkins') : SALES_REPS[repIndex].name;
                  const assignedRepId = lead.assigned_to || SALES_REPS[repIndex].id;

                  // Flexible vehicle parsing
                  let vehicle = "i20 Asta";
                  let budget = "₹8L - ₹11L";
                  try {
                    const parsedNotes = JSON.parse(lead.notes || "{}");
                    if (parsedNotes.vehicle) {
                      vehicle = parsedNotes.vehicle;
                    } else if (lead.notes?.includes("Creta")) {
                      vehicle = "Hyundai Creta SX";
                    }
                    if (parsedNotes.budget) {
                      budget = parsedNotes.budget;
                    }
                  } catch (e) {
                    if (lead.notes?.includes("Creta")) {
                      vehicle = "Hyundai Creta SX";
                      budget = "₹14L - ₹18L";
                    }
                  }

                  return (
                    <ClickableRow key={lead.id} href={`/leads/${lead.id}`} className="hover:bg-muted/40 transition-colors group relative border-b border-border/40">
                      {/* Checkbox Column Row Cell */}
                      <td 
                        className="w-12 px-5 py-4 text-center cursor-pointer hover:bg-muted/80 transition-colors" 
                        onClick={e => {
                          e.stopPropagation();
                          handleToggleLead(lead.id);
                        }}
                      >
                        <input 
                          type="checkbox" 
                          checked={selectedLeadIds.includes(lead.id)}
                          onChange={() => {}} // Handled by cell onClick
                          className="rounded border-border text-blue-600 focus:ring-blue-500 accent-blue-600 size-4 cursor-pointer pointer-events-none"
                        />
                      </td>

                      <td className="px-5 py-4 relative">
                        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex items-center gap-3">
                          <img 
                            src={getAvatarFallbackUrl(lead.id)} 
                            alt={lead.name}
                            className="w-9 h-9 rounded-full object-cover border border-border flex-shrink-0"
                          />
                          <div className="flex flex-col">
                            <span className="font-semibold text-foreground group-hover:text-blue-500 transition-colors">
                              {lead.name}
                            </span>
                            <span className="text-[13px] text-muted-foreground">{lead.phone || lead.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={cn("px-2.5 py-1 rounded-full text-[11px] font-bold border", intentColor)}>
                          {intent} ({lead.score})
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground/90">{vehicle}</span>
                          <span className="text-[12px] text-muted-foreground">{budget}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-[13px] font-medium text-muted-foreground capitalize px-2 py-1 bg-muted border border-border rounded-md">
                          {lead.source}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <img 
                            src={getAvatarFallbackUrl(assignedRepId)} 
                            alt="Sales Rep" 
                            className="w-6 h-6 rounded-full object-cover border border-border"
                          />
                          <span className="text-[13px] font-medium text-foreground/90">
                            {assignedRepName}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={lead.status as StatusVariant} />
                      </td>
                      <td className="px-5 py-4">
                        <SlaTimer createdAt={lead.created_at} status={lead.status} />
                      </td>
                      {/* Action Cell - Fully hidden with transition until row is hovered */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <a href={`tel:${lead.phone}`} onClick={e => e.stopPropagation()} className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors" title="Call">
                            <Phone className="size-4" />
                          </a>
                          <a href={`mailto:${lead.email}`} onClick={e => e.stopPropagation()} className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors" title="Email">
                            <Mail className="size-4" />
                          </a>
                          <div className="w-px h-4 bg-border mx-1" />
                          <EditLeadDialog lead={lead} />
                        </div>
                      </td>
                    </ClickableRow>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border bg-card px-5 py-3 shrink-0 rounded-b-2xl">
            <p className="text-[11px] font-bold text-muted-foreground">
              Showing <span className="text-foreground">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
              <span className="text-foreground">
                {Math.min(currentPage * itemsPerPage, filteredLeads.length)}
              </span>{" "}
              of <span className="text-foreground">{filteredLeads.length}</span> leads
            </p>
            
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1 rounded-md border border-border text-[11px] font-extrabold bg-background text-foreground hover:bg-muted disabled:opacity-50 transition-colors cursor-pointer"
              >
                Prev
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pageNum = idx + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={cn(
                        "w-6 h-6 rounded-md text-[11px] font-extrabold transition-all cursor-pointer",
                        currentPage === pageNum
                          ? "bg-blue-600 text-white shadow-sm"
                          : "border border-border bg-background text-foreground hover:bg-muted"
                      )}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1 rounded-md border border-border text-[11px] font-extrabold bg-background text-foreground hover:bg-muted disabled:opacity-50 transition-colors cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Floating Bulk Actions Panel */}
      {selectedLeadIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-card border border-border shadow-2xl rounded-2xl py-4 px-6 max-w-2xl w-full mx-auto flex flex-col gap-4 animate-in slide-in-from-bottom-5 duration-300">
          
          {/* Panel Top Header */}
          <div className="flex items-center justify-between border-b border-border pb-2.5">
            <div className="flex items-center gap-2">
              <span className="flex h-5 px-2 bg-blue-600 text-white font-black text-[10px] rounded-full items-center justify-center">
                {selectedLeadIds.length}
              </span>
              <p className="text-sm font-bold text-foreground">Leads selected for bulk operations</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex bg-muted/60 p-0.5 rounded-lg border border-border">
                <button 
                  onClick={() => setActiveTab("reassign")}
                  className={cn("px-2.5 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer", activeTab === "reassign" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
                >
                  Bulk Reassign
                </button>
                <button 
                  onClick={() => setActiveTab("share")}
                  className={cn("px-2.5 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer", activeTab === "share" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
                >
                  Share via Chat
                </button>
                {currentUser?.role === 'manager' && (
                  <button 
                    onClick={() => setActiveTab("archive")}
                    className={cn("px-2.5 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer flex items-center gap-1", activeTab === "archive" ? "bg-amber-500/15 text-amber-600 shadow-sm" : "text-muted-foreground hover:text-foreground")}
                  >
                    <Archive className="size-3" /> Archive
                  </button>
                )}
              </div>
              <button 
                onClick={() => setSelectedLeadIds([])}
                className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* Tab 1: Bulk Reassign */}
          {activeTab === "reassign" && (
            <div className="flex items-center justify-between gap-4 animate-in fade-in duration-200">
              <div className="flex-1 flex items-center gap-3">
                <Users className="size-4 text-muted-foreground shrink-0" />
                <select 
                  value={chosenRepId}
                  onChange={e => setChosenRepId(e.target.value)}
                  className="flex-1 h-9 px-3 bg-muted border border-border text-foreground text-sm font-semibold rounded-lg outline-none cursor-pointer"
                >
                  {SALES_REPS.map(rep => (
                    <option key={rep.id} value={rep.id}>Reassign to: {rep.name}</option>
                  ))}
                </select>
              </div>

              <button 
                onClick={handleBulkReassign}
                disabled={bulkLoading}
                className="h-9 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm shadow-blue-600/10 cursor-pointer shrink-0"
              >
                {bulkLoading ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
                <span>Execute Transfer</span>
              </button>
            </div>
          )}

          {/* Tab 2: Share via Chat */}
          {activeTab === "share" && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-4">
                <div className="flex-1 flex items-center gap-3">
                  <Send className="size-4 text-muted-foreground shrink-0" />
                  <select 
                    value={shareRepId}
                    onChange={e => setShareRepId(e.target.value)}
                    className="flex-1 h-9 px-3 bg-muted border border-border text-foreground text-sm font-semibold rounded-lg outline-none cursor-pointer"
                  >
                    {SALES_REPS.map(rep => (
                      <option key={rep.id} value={rep.id}>Send chat to: {rep.name}</option>
                    ))}
                  </select>
                </div>
                
                <button 
                  onClick={handleBulkShare}
                  disabled={bulkLoading}
                  className="h-9 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm shadow-blue-600/10 cursor-pointer shrink-0"
                >
                  {bulkLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                  <span>Share Profiles</span>
                </button>
              </div>

              <input 
                type="text" 
                placeholder="Attach custom note with the shared list (e.g. Please follow up on this exchange vehicle ASAP)"
                value={shareNote}
                onChange={e => setShareNote(e.target.value)}
                className="w-full h-9 px-3 bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground/60 text-xs font-medium rounded-lg outline-none focus:border-blue-500 focus:bg-card transition-all"
              />
            </div>
          )}

          {/* Tab 3: Archive to Ledger */}
          {activeTab === "archive" && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="flex items-start gap-3 p-3 bg-amber-500/8 border border-amber-500/20 rounded-xl">
                <Archive className="size-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground">
                    Archive {selectedLeadIds.length} lead(s) to Ledger
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Only <span className="font-semibold text-emerald-600">converted</span> and <span className="font-semibold text-rose-500">lost</span> leads are eligible. Others will be skipped. This action is reversible from the Ledger page.
                  </p>
                </div>
                <button
                  onClick={handleArchiveToLedger}
                  disabled={bulkLoading}
                  className="h-9 px-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer shrink-0"
                >
                  {bulkLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Archive className="size-3.5" />}
                  <span>Move to Ledger</span>
                </button>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
