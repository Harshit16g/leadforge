"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { UserCheck, ArrowLeftRight, CheckCircle2, AlertCircle, Activity, Sparkles, Loader2, X, PhoneCall, Mail, Calendar, ShieldCheck, ChevronLeft } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { addInteraction } from "@/app/actions/leads";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";

interface LeadActionPanelProps {
  leadId: string;
  leadName: string;
  leadCreatedAt: string;
  interactions: any[];
}

const ADVISORS = [
  { name: "Michael Chen", role: "Sales Manager" },
  { name: "Sarah Jenkins", role: "Senior Sales Advisor" },
  { name: "David Kim", role: "Finance Desk Coordinator" },
  { name: "Priya Sharma", role: "Operations Lead" }
];

export function LeadActionPanel({ leadId, leadName, leadCreatedAt, interactions }: LeadActionPanelProps) {
  const { role } = useAuth();
  const supabase = createClient();
  const isManager = role === "manager";
  const [loading, setLoading] = useState(false);
  const [openTransfer, setOpenTransfer] = useState(false);
  const [openQuickActions, setOpenQuickActions] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState(ADVISORS[0].name);

  // Quick Action / Macro state variables
  const [selectedMacro, setSelectedMacro] = useState<string | null>(null);
  
  // Call parameters
  const [callNotes, setCallNotes] = useState("");
  
  // Brochure parameters
  const [selectedBrochure, setSelectedBrochure] = useState("Hyundai Creta SX (O) Diesel");
  
  // Test drive parameters
  const [driveDateTime, setDriveDateTime] = useState("");
  const [driveLocation, setDriveLocation] = useState("HSR Dealership Showroom");
  
  // Finance parameters
  const [financeOutcome, setFinanceOutcome] = useState("KYC & Aadhaar Validation Complete");
  const [financeNotes, setFinanceNotes] = useState("");

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
      (new Date(firstContact.created_at).getTime() - new Date(leadCreatedAt).getTime()) / 60000
    ));
    slaPill = (
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl text-xs font-bold shadow-sm">
        <CheckCircle2 className="size-3.5 shrink-0" />
        <span>Response Goal Met: {responseTime}m</span>
      </div>
    );
  } else {
    const elapsed = Math.floor((Date.now() - new Date(leadCreatedAt).getTime()) / 60000);
    const isBreached = elapsed >= 15;
    const remaining = 15 - elapsed;
    slaPill = (
      <div className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-xs font-bold shadow-sm",
        isBreached ? "bg-rose-500/10 text-rose-500 border-rose-500/20" : "bg-orange-500/10 text-orange-500 border-orange-500/20"
      )}>
        {isBreached ? <AlertCircle className="size-3.5 shrink-0" /> : <Activity className="size-3.5 shrink-0 animate-pulse" />}
        <span>{isBreached ? `Overdue: ${elapsed - 15}m` : `Goal: ${remaining}m left`}</span>
      </div>
    );
  }

  async function handleTransfer() {
    setLoading(true);
    try {
      await addInteraction(
        leadId, 
        "note", 
        `Lead successfully transferred to ${selectedRecipient} for further action.`
      );

      toast.success(`Lead successfully transferred to ${selectedRecipient}`);
      setOpenTransfer(false);
      
      setTimeout(() => {
        window.location.reload();
      }, 600);
    } catch (err: any) {
      toast.error("Failed to complete lead transfer");
    } finally {
      setLoading(false);
    }
  }

  async function handleReassign() {
    setLoading(true);
    try {
      const randomRecipient = ADVISORS[Math.floor(Math.random() * ADVISORS.length)];
      await addInteraction(
        leadId, 
        "note", 
        `Manager reassigned this lead to ${randomRecipient.name} (${randomRecipient.role}).`
      );

      toast.success(`Reassigned lead to ${randomRecipient.name}`);
      
      setTimeout(() => {
        window.location.reload();
      }, 600);
    } catch (err: any) {
      toast.error("Failed to reassign lead");
    } finally {
      setLoading(false);
    }
  }

  // Parameter-driven Macro runner
  async function runMacro(type: string, content: string, label: string) {
    setLoading(true);
    try {
      await addInteraction(leadId, type, content);
      toast.success(`Successfully executed macro: ${label}`);
      setOpenQuickActions(false);
      setSelectedMacro(null);
      
      // Reset forms
      setCallNotes("");
      setDriveDateTime("");
      setFinanceNotes("");

      setTimeout(() => {
        window.location.reload();
      }, 600);
    } catch (err: any) {
      toast.error("Failed to execute macro action");
    } finally {
      setLoading(false);
    }
  }

  function handleLogCall() {
    const trimmed = callNotes.trim();
    if (!trimmed) {
      toast.error("Please fill call discussion details");
      return;
    }
    const finalContent = `Outbound Call Log: ${trimmed}`;
    runMacro("call", finalContent, "Log Outbound Call");
  }

  function handleSendBrochure() {
    const finalContent = `Automation Macro: Emailed digital brochure for ${selectedBrochure}.`;
    runMacro("email", finalContent, `Sent ${selectedBrochure} Brochure`);
  }

  async function handleBookTestDrive() {
    if (!driveDateTime) {
      toast.error("Please pick appointment date & time");
      return;
    }
    
    setLoading(true);
    try {
      // 1. Fetch lead details dynamically
      const { data: leadData } = await supabase
        .from('leads')
        .select('phone, notes, assigned_to')
        .eq('id', leadId)
        .single();
      
      // Derive car model beautifully from notes/context
      let carModel = "Hyundai Creta SX (O) Turbo";
      if (leadData?.notes) {
        if (leadData.notes.includes("IONIQ")) carModel = "Hyundai IONIQ 5 (EV)";
        else if (leadData.notes.includes("Tucson")) carModel = "Hyundai Tucson Signature";
        else if (leadData.notes.includes("Verna")) carModel = "Hyundai Verna Turbo DCT";
        else if (leadData.notes.includes("i20")) carModel = "Hyundai i20 N-Line";
      }

      // 2. Insert record into test_drives table
      await supabase.from('test_drives').insert({
        lead_id: leadId,
        customer_name: leadName,
        customer_phone: leadData?.phone || null,
        car_model: carModel,
        status: 'scheduled',
        assigned_to: leadData?.assigned_to || null,
        scheduled_at: new Date(driveDateTime).toISOString(),
        notes: `Booked via Lead Quick Action at ${driveLocation}.`
      });

      // 3. Log the interaction timeline entry
      const formattedDate = new Date(driveDateTime).toLocaleString();
      const finalContent = `Appointment Scheduled: Doorstep test drive booked for ${formattedDate} at ${driveLocation}.`;
      await runMacro("meeting", finalContent, "Book Test Drive");

    } catch (err) {
      console.error("Error creating test drive booking:", err);
      toast.error("Failed to register test drive booking in database.");
    } finally {
      setLoading(false);
    }
  }

  function handleVerifyFinance() {
    const trimmedNotes = financeNotes.trim();
    const notesString = trimmedNotes ? ` (${trimmedNotes})` : "";
    const finalContent = `Verification Checked: Verified credit status - ${financeOutcome}${notesString}.`;
    runMacro("note", finalContent, "Verify Credit Check");
  }

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm p-4 space-y-4 flex-shrink-0">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
          <ArrowLeftRight className="size-4 text-muted-foreground" /> Actions & Operations
        </h3>
        {isManager ? (
          <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
            <UserCheck className="size-3"/> Manager View
          </span>
        ) : (
          <span className="px-2 py-0.5 bg-muted text-muted-foreground border border-border rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
            Sales View
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {isManager ? (
          <button
            onClick={handleReassign}
            disabled={loading}
            className="h-9 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? <Loader2 className="size-3.5 animate-spin" /> : <UserCheck className="size-3.5" />}
            Reassign Lead
          </button>
        ) : (
          <button
            onClick={() => setOpenTransfer(true)}
            disabled={loading}
            className="h-9 flex items-center justify-center gap-1.5 bg-card border border-border hover:bg-muted text-foreground rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <ArrowLeftRight className="size-3.5" />
            Transfer Lead
          </button>
        )}

        <button
          onClick={() => setOpenQuickActions(true)}
          className="h-9 flex items-center justify-center gap-1.5 bg-card border border-border hover:bg-muted text-foreground rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer"
        >
          <Sparkles className="size-3.5 text-blue-500" />
          Quick Actions
        </button>
      </div>

      <div className="h-px bg-border/60" />

      {/* Response Goal Badge in operations panel */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground">Response Goal</span>
        {slaPill}
      </div>

      {/* Transfer Dialog */}
      <Dialog open={openTransfer} onOpenChange={setOpenTransfer}>
        <DialogContent className="max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <ArrowLeftRight className="size-5 text-blue-500" /> Transfer Lead
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Select an authorized manager or specialist to transfer <span className="font-semibold text-foreground">{leadName}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Destination Agent</label>
            <select
              value={selectedRecipient}
              onChange={(e) => setSelectedRecipient(e.target.value)}
              className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-xs outline-none focus:border-blue-500 focus:bg-card transition-all text-foreground"
            >
              {ADVISORS.map((advisor) => (
                <option key={advisor.name} value={advisor.name}>
                  {advisor.name} ({advisor.role})
                </option>
              ))}
            </select>
          </div>

          <DialogFooter className="flex items-center justify-end gap-2 border-t border-border pt-4">
            <button
              onClick={() => setOpenTransfer(false)}
              className="px-3.5 py-1.5 bg-muted text-muted-foreground hover:bg-muted/80 rounded-lg text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleTransfer}
              disabled={loading}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading && <Loader2 className="size-3 animate-spin" />}
              Confirm Transfer
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Actions Parameterized Bottom Sheet */}
      {openQuickActions && (
        <>
          {/* Backdrop */}
          <div 
            onClick={() => { setOpenQuickActions(false); setSelectedMacro(null); }} 
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity" 
          />
          
          {/* Bottom Sheet */}
          <div className="fixed inset-x-0 bottom-0 z-50 bg-card border-t border-border rounded-t-2xl shadow-2xl p-6 transition-all transform duration-300 translate-y-0 animate-in slide-in-from-bottom max-w-2xl mx-auto">
            
            {/* Header: Adaptable based on whether a macro is chosen */}
            <div className="flex items-center justify-between mb-4 border-b border-border/80 pb-3 flex-shrink-0">
              <div className="flex items-center gap-2">
                {selectedMacro ? (
                  <button 
                    onClick={() => setSelectedMacro(null)}
                    className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer mr-1"
                  >
                    <ChevronLeft className="size-5" />
                  </button>
                ) : (
                  <Sparkles className="size-5 text-blue-500" />
                )}
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    {selectedMacro === "call" && "Macro Parameters: Log Outbound Call"}
                    {selectedMacro === "brochure" && "Macro Parameters: Send Digital Brochure"}
                    {selectedMacro === "meeting" && "Macro Parameters: Book Test Drive"}
                    {selectedMacro === "finance" && "Macro Parameters: Verify Finance & Credit"}
                    {!selectedMacro && "Quick Action & Macro Console"}
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    {selectedMacro ? "Configure parameters before running workflow automation" : "Configure parameters before running workflow automation"}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => { setOpenQuickActions(false); setSelectedMacro(null); }}
                className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Content Switcher */}
            {selectedMacro === null ? (
              // Step 1: List of quick action buttons
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-2">
                <button
                  onClick={() => setSelectedMacro("call")}
                  className="flex items-center gap-3 p-3 bg-muted/40 hover:bg-muted border border-border/80 hover:border-border rounded-xl transition-all text-left cursor-pointer group"
                >
                  <div className="size-10 bg-blue-500/10 text-blue-500 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                    <PhoneCall className="size-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-foreground">Log Outbound Call</h4>
                    <p className="text-[10px] text-muted-foreground truncate">Enter discussed details and numbers discussed</p>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedMacro("brochure")}
                  className="flex items-center gap-3 p-3 bg-muted/40 hover:bg-muted border border-border/80 hover:border-border rounded-xl transition-all text-left cursor-pointer group"
                >
                  <div className="size-10 bg-emerald-500/10 text-emerald-500 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                    <Mail className="size-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-foreground">Send Brochure</h4>
                    <p className="text-[10px] text-muted-foreground truncate">Select which vehicle catalog brochure to send</p>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedMacro("meeting")}
                  className="flex items-center gap-3 p-3 bg-muted/40 hover:bg-muted border border-border/80 hover:border-border rounded-xl transition-all text-left cursor-pointer group"
                >
                  <div className="size-10 bg-purple-500/10 text-purple-500 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                    <Calendar className="size-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-foreground">Book Test Drive</h4>
                    <p className="text-[10px] text-muted-foreground truncate">Set test drive time, date, and dealership location</p>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedMacro("finance")}
                  className="flex items-center gap-3 p-3 bg-muted/40 hover:bg-muted border border-border/80 hover:border-border rounded-xl transition-all text-left cursor-pointer group"
                >
                  <div className="size-10 bg-orange-500/10 text-orange-500 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                    <ShieldCheck className="size-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-foreground">Verify Finance & Credit</h4>
                    <p className="text-[10px] text-muted-foreground truncate">Log KYC, CIBIL, or bank loan milestones</p>
                  </div>
                </button>
              </div>
            ) : (
              // Step 2: Custom parameter input forms
              <div className="py-2 animate-in fade-in duration-200">
                {selectedMacro === "call" && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">What happened throughout the call?</label>
                      <textarea
                        value={callNotes}
                        onChange={(e) => setCallNotes(e.target.value)}
                        placeholder="Discussed SUV dimensions, final pricing options, and the customer requested a Saturday test drive."
                        className="w-full h-24 px-3 py-2 bg-muted/50 border border-border rounded-lg text-xs outline-none focus:border-blue-500 focus:bg-card transition-all text-foreground resize-none"
                        autoFocus
                      />
                    </div>
                    <div className="flex gap-2 justify-end border-t border-border pt-4">
                      <button
                        onClick={() => setSelectedMacro(null)}
                        className="px-3.5 py-1.5 bg-muted text-muted-foreground hover:bg-muted/80 rounded-lg text-xs font-bold cursor-pointer"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleLogCall}
                        disabled={loading}
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        {loading ? <Loader2 className="size-3 animate-spin" /> : <PhoneCall className="size-3" />}
                        Log Call Outcome
                      </button>
                    </div>
                  </div>
                )}

                {selectedMacro === "brochure" && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">Select Brochure Package</label>
                      <select
                        value={selectedBrochure}
                        onChange={(e) => setSelectedBrochure(e.target.value)}
                        className="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-lg text-xs outline-none focus:border-blue-500 focus:bg-card transition-all text-foreground cursor-pointer"
                        autoFocus
                      >
                        <option value="Hyundai Creta SX (O) Diesel">Hyundai Creta SX (O) Diesel Brochure</option>
                        <option value="Hyundai Tucson Signature (O)">Hyundai Tucson Signature (O) Brochure</option>
                        <option value="Kia Seltos GTX+ Petrol">Kia Seltos GTX+ Petrol Brochure</option>
                        <option value="Kia Sonet HTX Turbo">Kia Sonet HTX Turbo Brochure</option>
                        <option value="Hyundai Verna SX Executive">Hyundai Verna SX Executive Brochure</option>
                      </select>
                    </div>
                    <div className="flex gap-2 justify-end border-t border-border pt-4">
                      <button
                        onClick={() => setSelectedMacro(null)}
                        className="px-3.5 py-1.5 bg-muted text-muted-foreground hover:bg-muted/80 rounded-lg text-xs font-bold cursor-pointer"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleSendBrochure}
                        disabled={loading}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        {loading ? <Loader2 className="size-3 animate-spin" /> : <Mail className="size-3" />}
                        Send Brochure Email
                      </button>
                    </div>
                  </div>
                )}

                {selectedMacro === "meeting" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">Test Drive Date & Time</label>
                        <input
                          type="datetime-local"
                          value={driveDateTime}
                          onChange={(e) => setDriveDateTime(e.target.value)}
                          className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-xs outline-none focus:border-blue-500 focus:bg-card transition-all text-foreground cursor-pointer"
                          autoFocus
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">Test Drive Location</label>
                        <input
                          type="text"
                          value={driveLocation}
                          onChange={(e) => setDriveLocation(e.target.value)}
                          placeholder="e.g. HSR Showroom / Doorstep Address"
                          className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-xs outline-none focus:border-blue-500 focus:bg-card transition-all text-foreground"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end border-t border-border pt-4">
                      <button
                        onClick={() => setSelectedMacro(null)}
                        className="px-3.5 py-1.5 bg-muted text-muted-foreground hover:bg-muted/80 rounded-lg text-xs font-bold cursor-pointer"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleBookTestDrive}
                        disabled={loading}
                        className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        {loading ? <Loader2 className="size-3 animate-spin" /> : <Calendar className="size-3" />}
                        Confirm Appointment
                      </button>
                    </div>
                  </div>
                )}

                {selectedMacro === "finance" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">Verification Checklist Step</label>
                        <select
                          value={financeOutcome}
                          onChange={(e) => setFinanceOutcome(e.target.value)}
                          className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-xs outline-none focus:border-blue-500 focus:bg-card transition-all text-foreground cursor-pointer"
                          autoFocus
                        >
                          <option value="KYC & Aadhaar Validation Complete">KYC & Aadhaar Validation Complete</option>
                          <option value="Income Proof & Salary Statements Verified">Income Proof & Salary Statements Verified</option>
                          <option value="CIBIL Score Verified (>750)">CIBIL Score Verified (&gt;750)</option>
                          <option value="Pre-Approved Bank Loan Active">Pre-Approved Bank Loan Active</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">Additional Finance Desk Notes</label>
                        <input
                          type="text"
                          value={financeNotes}
                          onChange={(e) => setFinanceNotes(e.target.value)}
                          placeholder="e.g. Verified Aadhaar KYC, ID proof upload pending."
                          className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-xs outline-none focus:border-blue-500 focus:bg-card transition-all text-foreground"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end border-t border-border pt-4">
                      <button
                        onClick={() => setSelectedMacro(null)}
                        className="px-3.5 py-1.5 bg-muted text-muted-foreground hover:bg-muted/80 rounded-lg text-xs font-bold cursor-pointer"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleVerifyFinance}
                        disabled={loading}
                        className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {loading ? <Loader2 className="size-3 animate-spin" /> : <ShieldCheck className="size-3.5" />}
                        Log Credit Milestones
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
