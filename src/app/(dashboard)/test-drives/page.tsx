"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { PageHeader } from "@/components/common/PageHeader";
import { useConfirm } from "@/contexts/ConfirmContext";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Car, Play, Square, CheckCircle, XCircle, Plus, 
  Calendar, Clock, User, Filter, AlertCircle, Sparkles, Check
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Curated Hyundai vehicle list
const VEHICLES = [
  "Hyundai IONIQ 5 (EV)",
  "Hyundai Creta SX (O) Turbo",
  "Hyundai Tucson Signature",
  "Hyundai Verna Turbo DCT",
  "Hyundai Venue N-Line",
  "Hyundai i20 N-Line"
];

export default function TestDrivesPage() {
  const { user: authUser, role } = useAuth();
  const confirm = useConfirm();
  const supabase = createClient();

  // State
  const [drives, setDrives] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [reps, setReps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sandboxMode, setSandboxMode] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [carFilter, setCarFilter] = useState<string>("all");

  // Booking Modal Form
  const [showModal, setShowModal] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [selectedCar, setSelectedCar] = useState(VEHICLES[0]);
  const [selectedRepId, setSelectedRepId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [notes, setNotes] = useState("");

  // Feedback Modal Form (when completing a drive)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [activeDriveForFeedback, setActiveDriveForFeedback] = useState<any>(null);
  const [feedbackNotes, setFeedbackNotes] = useState("");

  // Load leads, reps, and test drives
  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // 1. Fetch leads & representative profiles
      const { data: leadsData } = await supabase.from("leads").select("*").eq("archived", false);
      setLeads(leadsData || []);

      const { data: repsData } = await supabase.from("profiles").select("*");
      setReps(repsData || []);

      // 2. Fetch test drives
      const { data: drivesData, error: drivesError } = await supabase
        .from("test_drives")
        .select("*")
        .order("scheduled_at", { ascending: false });

      if (drivesError) {
        console.warn("Test drives table not yet created in Supabase. Activating Sandbox mode!");
        setSandboxMode(true);
        loadLocalSandbox();
      } else {
        setDrives(drivesData || []);
        setSandboxMode(false);
      }
    } catch (err) {
      console.error("Database connection issue. Activating Sandbox Mode:", err);
      setSandboxMode(true);
      loadLocalSandbox();
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Load Sandbox state from LocalStorage
  const loadLocalSandbox = () => {
    const saved = localStorage.getItem("driveflow_test_drives_sandbox");
    if (saved) {
      setDrives(JSON.parse(saved));
    } else {
      // Default dynamic mock test drives
      const defaultMock = [
        {
          id: "mock-1",
          customer_name: "Arjun Mehta",
          customer_phone: "+91 9876543210",
          car_model: "Hyundai Creta SX (O) Turbo",
          status: "scheduled",
          assigned_to: reps[0]?.id || "sarah-rep-id",
          scheduled_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // +4 hours
          notes: "Interested in Creta panoramic sunroof. Wants standard highway loop test."
        },
        {
          id: "mock-2",
          customer_name: "Priya Saini",
          customer_phone: "+91 8765432109",
          car_model: "Hyundai Tucson Signature",
          status: "active",
          assigned_to: reps[1]?.id || "michael-rep-id",
          scheduled_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 mins ago
          started_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          notes: "Demonstrate ADAS lane-keep assist on Expressway."
        },
        {
          id: "mock-3",
          customer_name: "Ananya Desai",
          customer_phone: "+91 6543210987",
          car_model: "Hyundai IONIQ 5 (EV)",
          status: "completed",
          assigned_to: reps[2]?.id || "priya-rep-id",
          scheduled_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          started_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          completed_at: new Date(Date.now() - 23.5 * 60 * 60 * 1000).toISOString(),
          notes: "V2L demonstration successful. Customer loved ultra-fast charging."
        }
      ];
      setDrives(defaultMock);
      localStorage.setItem("driveflow_test_drives_sandbox", JSON.stringify(defaultMock));
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Helper to persist sandbox changes
  const saveSandbox = (updatedDrives: any[]) => {
    setDrives(updatedDrives);
    localStorage.setItem("driveflow_test_drives_sandbox", JSON.stringify(updatedDrives));
  };

  // ─── Actions ──────────────────────────────────────────────────────────────

  // 1. Schedule a Test Drive
  const handleScheduleDrive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName || !scheduledAt) {
      toast.error("Please fill in customer name and schedule date!");
      return;
    }

    const drivePayload = {
      lead_id: selectedLeadId || null,
      customer_name: newCustName,
      customer_phone: newCustPhone || null,
      car_model: selectedCar,
      status: "scheduled",
      assigned_to: selectedRepId || null,
      scheduled_at: new Date(scheduledAt).toISOString(),
      notes: notes || null
    };

    if (sandboxMode) {
      const newMockDrive = {
        id: `mock-${Date.now()}`,
        ...drivePayload
      };
      const updated = [newMockDrive, ...drives];
      saveSandbox(updated);
      toast.success(`Scheduled test drive for ${newCustName}! 🚗`);
    } else {
      toast.promise(
        async () => {
          const { error } = await supabase.from("test_drives").insert(drivePayload);
          if (error) throw error;
          await loadData();
        },
        {
          loading: "Scheduling test drive...",
          success: `Scheduled test drive for ${newCustName}! 🚗`,
          error: "Failed to schedule test drive booking."
        }
      );
    }

    // Reset Form
    setNewCustName("");
    setNewCustPhone("");
    setSelectedLeadId("");
    setSelectedCar(VEHICLES[0]);
    setSelectedRepId("");
    setScheduledAt("");
    setNotes("");
    setShowModal(false);
  };

  // 2. Start ongoing Test Drive
  const handleStartDrive = async (id: string, name: string) => {
    const startPayload = {
      status: "active",
      started_at: new Date().toISOString()
    };

    if (sandboxMode) {
      const updated = drives.map(d => d.id === id ? { ...d, ...startPayload } : d);
      saveSandbox(updated);
      toast.info(`Test drive started for ${name}! 🛣️`);
    } else {
      toast.promise(
        async () => {
          const { error } = await supabase.from("test_drives").update(startPayload).eq("id", id);
          if (error) throw error;
          await loadData();
        },
        {
          loading: "Starting test drive session...",
          success: `Test drive started for ${name}! 🛣️`,
          error: "Failed to start test drive."
        }
      );
    }
  };

  // 3. Initiate Complete Flow (Opens feedback modal)
  const initiateCompleteDrive = (drive: any) => {
    setActiveDriveForFeedback(drive);
    setFeedbackNotes("");
    setShowFeedbackModal(true);
  };

  // 4. Complete Test Drive with notes
  const handleCompleteDrive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDriveForFeedback) return;

    const completePayload = {
      status: "completed",
      completed_at: new Date().toISOString(),
      notes: feedbackNotes ? `${activeDriveForFeedback.notes || ''} — Feedback: ${feedbackNotes}` : activeDriveForFeedback.notes
    };

    if (sandboxMode) {
      const updated = drives.map(d => d.id === activeDriveForFeedback.id ? { ...d, ...completePayload } : d);
      saveSandbox(updated);
      toast.success(`Completed test drive for ${activeDriveForFeedback.customer_name}! 🎉`);
    } else {
      toast.promise(
        async () => {
          const { error } = await supabase
            .from("test_drives")
            .update(completePayload)
            .eq("id", activeDriveForFeedback.id);
          if (error) throw error;
          await loadData();
        },
        {
          loading: "Recording completion details...",
          success: `Completed test drive for ${activeDriveForFeedback.customer_name}! 🎉`,
          error: "Failed to complete test drive."
        }
      );
    }

    setShowFeedbackModal(false);
    setActiveDriveForFeedback(null);
  };

  // 5. Cancel or delete test drive
  const handleCancelDrive = async (id: string, name: string) => {
    const isConfirmed = await confirm({
      title: "Cancel Booking",
      description: `Are you sure you want to cancel the test drive schedule for ${name}?`,
      confirmText: "Yes, Cancel",
      cancelText: "Keep Schedule",
      variant: "destructive"
    });

    if (!isConfirmed) return;

    if (sandboxMode) {
      const updated = drives.map(d => d.id === id ? { ...d, status: "cancelled" } : d);
      saveSandbox(updated);
      toast.success(`Cancelled test drive for ${name}.`);
    } else {
      toast.promise(
        async () => {
          const { error } = await supabase.from("test_drives").update({ status: "cancelled" }).eq("id", id);
          if (error) throw error;
          await loadData();
        },
        {
          loading: "Cancelling booking...",
          success: `Cancelled test drive for ${name}.`,
          error: "Failed to cancel test drive booking."
        }
      );
    }
  };

  // Link selected Lead details directly to Form
  const handleLeadSelect = (leadId: string) => {
    setSelectedLeadId(leadId);
    if (leadId) {
      const selected = leads.find(l => l.id === leadId);
      if (selected) {
        setNewCustName(selected.name);
        setNewCustPhone(selected.phone || "");
        if (selected.assigned_to) {
          setSelectedRepId(selected.assigned_to);
        }
      }
    }
  };

  // Rep name lookup utility
  const getRepName = (repId: string) => {
    const found = reps.find(r => r.id === repId);
    return found ? found.name : "Unassigned Advisor";
  };

  // Filtered drive computations
  const filteredDrives = drives.filter(d => {
    const matchesStatus = statusFilter === "all" || d.status === statusFilter;
    const matchesCar = carFilter === "all" || d.car_model === carFilter;
    return matchesStatus && matchesCar;
  });

  return (
    <div className="flex-1 h-full w-full overflow-y-auto pr-2 space-y-6 pb-12 max-w-[1440px] mx-auto scrollbar-thin">
      
      {/* Dynamic Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between shrink-0">
        <div>
          <PageHeader 
            title="Test Drive Terminal" 
            subtitle="Manage scheduled client demo drives, trigger live vehicle runs, and track dealership satisfaction KPIs."
          />
        </div>
        <div>
          <button
            onClick={() => setShowModal(true)}
            className="h-10 px-5 rounded-2xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-2 hover:bg-primary/95 shadow-lg shadow-primary/10 transition-all cursor-pointer"
          >
            <Plus className="size-4" />
            <span>Book Test Drive</span>
          </button>
        </div>
      </div>

      {/* Sandbox Mode Notification */}
      {sandboxMode && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 p-4 rounded-2xl flex items-start gap-3">
          <AlertCircle className="size-5 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <Sparkles className="size-3.5 animate-pulse" /> Sandbox Interactive Mode Enabled
            </p>
            <p>
              Supabase table `test_drives` not yet applied. Rest assured, you can interactively schedule, start, and complete test drives! All sandbox test drives are persisted locally in your browser.
            </p>
          </div>
        </div>
      )}

      {/* Live SLA & Counters Snapshots */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
        <div className="bg-card border border-border rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Scheduled Bookings</span>
            <div className="w-8 h-8 rounded-full bg-blue-500/5 text-blue-500 flex items-center justify-center">
              <Calendar className="size-4.5" />
            </div>
          </div>
          <p className="text-2xl font-black mt-2 text-foreground">
            {drives.filter(d => d.status === 'scheduled').length} Drives
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">Pending client arrivals today</p>
        </div>

        <div className="bg-rose-500/5 border border-rose-500/10 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Active On-Road Drives</span>
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
            </span>
          </div>
          <p className="text-2xl font-black mt-2 text-rose-600">
            {drives.filter(d => d.status === 'active').length} Active
          </p>
          <p className="text-[10px] text-rose-500 mt-1 font-semibold">Ongoing dynamic demo sessions</p>
        </div>

        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Completed Runs</span>
            <div className="w-8 h-8 rounded-full bg-emerald-500/5 text-emerald-500 flex items-center justify-center">
              <CheckCircle className="size-4.5" />
            </div>
          </div>
          <p className="text-2xl font-black mt-2 text-emerald-600">
            {drives.filter(d => d.status === 'completed').length} Completed
          </p>
          <p className="text-[10px] text-emerald-500 mt-1 font-semibold">Valuable feedback recorded</p>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-card border border-border rounded-3xl p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Filter className="size-3.5" />
            <span>Filter Status</span>
          </div>
          <div className="flex bg-muted p-0.5 rounded-xl text-[10px] font-bold uppercase">
            {["all", "scheduled", "active", "completed"].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-all cursor-pointer",
                  statusFilter === st ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                )}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-muted-foreground">Vehicle Filter</span>
          <select 
            value={carFilter}
            onChange={(e) => setCarFilter(e.target.value)}
            className="h-8 px-3 rounded-lg border border-border bg-background text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Models</option>
            {VEHICLES.map(v => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Drives Grid */}
      {filteredDrives.length === 0 ? (
        <div className="bg-card border border-border border-dashed rounded-3xl p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
          <Car className="size-8 text-slate-300 animate-pulse" />
          <p className="text-xs font-bold">No test drives match your search criteria.</p>
          <p className="text-[10px] text-slate-400">Click "Book Test Drive" to schedule a customer demo.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredDrives.map((drive) => {
            const isScheduled = drive.status === "scheduled";
            const isActive = drive.status === "active";
            const isCompleted = drive.status === "completed";
            const isCancelled = drive.status === "cancelled";

            return (
              <div 
                key={drive.id} 
                className={cn(
                  "bg-card border rounded-3xl p-5 shadow-sm transition-all duration-300 hover:shadow-md flex flex-col justify-between gap-4 group relative overflow-hidden",
                  isActive ? "border-rose-500/30 ring-1 ring-rose-500/10" : "border-border"
                )}
              >
                {/* Active Indicator Pulse */}
                {isActive && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-500 bg-[length:200%_auto] animate-pulse" />
                )}

                {/* Status Badge */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                      <Car className="size-4 text-primary" />
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-xs font-black text-foreground truncate">{drive.car_model}</h4>
                      <p className="text-[9px] text-muted-foreground font-semibold mt-0.5">Vehicle Demo Model</p>
                    </div>
                  </div>

                  <span className={cn(
                    "text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full",
                    isScheduled ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" :
                    isActive ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 animate-pulse" :
                    isCompleted ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
                    "bg-slate-500/10 text-slate-600"
                  )}>
                    {drive.status}
                  </span>
                </div>

                {/* Details Section */}
                <div className="space-y-2 border-y border-border/50 py-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1 shrink-0">
                      <User className="size-3.5" /> Customer:
                    </span>
                    <span className="font-bold text-foreground text-right truncate pl-4">{drive.customer_name}</span>
                  </div>
                  {drive.customer_phone && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground shrink-0">Phone:</span>
                      <span className="font-medium text-muted-foreground">{drive.customer_phone}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1 shrink-0">
                      <Clock className="size-3.5" /> Scheduled:
                    </span>
                    <span className="font-semibold text-foreground">
                      {new Date(drive.scheduled_at).toLocaleDateString()} @ {new Date(drive.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground shrink-0">Advisor Assigned:</span>
                    <span className="font-bold text-primary">{getRepName(drive.assigned_to)}</span>
                  </div>

                  {/* Active timestamps */}
                  {drive.started_at && (
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>Started At:</span>
                      <span>{new Date(drive.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  )}
                  {drive.completed_at && (
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>Completed At:</span>
                      <span>{new Date(drive.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  )}
                </div>

                {/* Notes log */}
                {drive.notes && (
                  <p className="text-[10px] text-muted-foreground italic bg-muted/40 p-2.5 rounded-xl line-clamp-2">
                    "{drive.notes}"
                  </p>
                )}

                {/* Operations Terminal Control Deck */}
                {!isCompleted && !isCancelled && (
                  <div className="flex items-center gap-2 mt-1">
                    {isScheduled && (
                      <button
                        onClick={() => handleStartDrive(drive.id, drive.customer_name)}
                        className="flex-1 py-1.5 px-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-[10px] font-bold text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Play className="size-3 fill-current" />
                        <span>Start Drive</span>
                      </button>
                    )}

                    {isActive && (
                      <button
                        onClick={() => initiateCompleteDrive(drive)}
                        className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-[10px] font-bold text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Square className="size-3 fill-current" />
                        <span>Complete Drive</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleCancelDrive(drive.id, drive.customer_name)}
                      className="py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] font-bold text-muted-foreground transition-colors cursor-pointer"
                    >
                      <XCircle className="size-3.5 text-rose-500" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 1. Log / Book Test Drive Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-lg rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-border/80">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Car className="size-4.5 text-primary" /> Book Dealership Test Drive
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-muted-foreground hover:text-foreground text-xs font-bold"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleScheduleDrive} className="space-y-4 pt-4 text-xs">
              
              {/* Optional: Link to Lead */}
              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">Link Existing Intake Lead (Optional)</label>
                <select
                  value={selectedLeadId}
                  onChange={(e) => handleLeadSelect(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">-- Create Standalone Schedule --</option>
                  {leads.map(l => (
                    <option key={l.id} value={l.id}>{l.name} ({l.source})</option>
                  ))}
                </select>
              </div>

              {/* Cust Name */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">Customer Name *</label>
                  <input
                    required
                    type="text"
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">Phone Number</label>
                  <input
                    type="text"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    placeholder="e.g. +91 9999999999"
                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Car Selection */}
              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">Select Demo Vehicle Model *</label>
                <select
                  value={selectedCar}
                  onChange={(e) => setSelectedCar(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-bold"
                >
                  {VEHICLES.map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>

              {/* Schedule time & advisor */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">Scheduled Date & Time *</label>
                  <input
                    required
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">Assign Representative *</label>
                  <select
                    value={selectedRepId}
                    onChange={(e) => setSelectedRepId(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">-- Choose Advisor --</option>
                    {reps.map(r => (
                      <option key={r.id} value={r.id}>{r.name} ({r.role})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">Pre-Drive Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Describe demo routes, customer priorities, vehicle preferences..."
                  rows={2}
                  className="w-full p-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full h-10 rounded-2xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/95 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-primary/10"
                >
                  <Check className="size-4" />
                  <span>Confirm Booking Schedule</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 2. Complete Feedback Modal */}
      {showFeedbackModal && activeDriveForFeedback && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-border/80">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <CheckCircle className="size-4 text-emerald-600" /> Complete Test Drive Session
              </h3>
              <button 
                onClick={() => setShowFeedbackModal(false)}
                className="text-muted-foreground hover:text-foreground text-xs font-bold"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCompleteDrive} className="space-y-4 pt-4 text-xs">
              <div className="bg-muted/40 p-3 rounded-2xl border text-muted-foreground text-[10px] space-y-1">
                <p><strong>Customer:</strong> {activeDriveForFeedback.customer_name}</p>
                <p><strong>Vehicle:</strong> {activeDriveForFeedback.car_model}</p>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-muted-foreground">On-Road Experience & Feedback Notes *</label>
                <textarea
                  required
                  value={feedbackNotes}
                  onChange={(e) => setFeedbackNotes(e.target.value)}
                  placeholder="Record customer experience, car impressions, key highlights, or issues raised during the drive..."
                  rows={4}
                  className="w-full p-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full h-10 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-primary-foreground text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-600/10"
                >
                  <Check className="size-4" />
                  <span>Log Drive Completion</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
