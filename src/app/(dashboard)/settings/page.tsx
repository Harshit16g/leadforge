"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/common/PageHeader";
import { 
  Settings as SettingsIcon, 
  Bell, 
  Lock, 
  User, 
  Palette, 
  Database, 
  ShieldCheck, 
  Clock, 
  Check, 
  Loader2,
  LockKeyhole
} from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { role } = useAuth();
  const isManager = role === "manager";
  
  const [activeTab, setActiveTab] = useState(isManager ? "general" : "profile");
  const [loading, setLoading] = useState(false);

  // Form States
  const [dealershipName, setDealershipName] = useState("HSR Motors");
  const [supportEmail, setSupportEmail] = useState("support@hsrmotors.com");
  const [timezone, setTimezone] = useState("Asia/Kolkata (IST)");
  const [fullName, setFullName] = useState(isManager ? "Michael Chen" : "Sarah Jenkins");
  const [personalEmail, setPersonalEmail] = useState(isManager ? "michael@hsrmotors.com" : "sarah@hsrmotors.com");
  const [slaTime, setSlaTime] = useState("15m");
  const [selectedTheme, setSelectedTheme] = useState("System");
  
  // Tab configuration
  const tabs = isManager 
    ? [
        { id: 'general', label: 'General Dealership', icon: SettingsIcon },
        { id: 'profile', label: 'My Profile', icon: User },
        { id: 'notifications', label: 'Dealership Alerts', icon: Bell },
        { id: 'appearance', label: 'Appearance', icon: Palette },
        { id: 'security', label: 'Security & Access', icon: Lock },
        { id: 'integrations', label: 'Integrations Desk', icon: Database },
      ]
    : [
        { id: 'profile', label: 'My Profile', icon: User },
        { id: 'appearance', label: 'Appearance', icon: Palette },
        { id: 'notifications', label: 'My Alerts', icon: Bell },
        { id: 'security', label: 'Security', icon: Lock },
      ];

  function handleSave() {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Settings saved successfully");
    }, 600);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 select-text flex-1 h-full max-h-full overflow-hidden flex flex-col w-full">
      <div className="shrink-0">
        <PageHeader 
          title="Settings" 
          subtitle={isManager 
            ? "Manage your global dealership settings, integrations, and operational policies."
            : "Customize your personal work profile, theme appearance, and notification alerts."
          } 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 flex-1 min-h-0 overflow-hidden">
        {/* Left Sidebar Navigation */}
        <div className="bg-card border border-border rounded-xl p-3 shadow-sm h-fit space-y-1">
          <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider px-3 mb-2">
            {isManager ? "Manager Console" : "Employee Console"}
          </p>
          {tabs.map((tab) => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === tab.id 
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/10' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <tab.icon className="size-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Right Active Panel */}
        <div className="md:col-span-3 h-full overflow-y-auto pr-1 scrollbar-thin">
          <div className="bg-card border border-border rounded-xl shadow-sm p-6 space-y-6">
            
            {/* General Dealership Settings Panel (Manager Only) */}
            {activeTab === "general" && isManager && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h2 className="text-lg font-bold text-foreground">General Dealership Settings</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Global configuration variables for your automotive workspace.</p>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Dealership Name</label>
                    <input 
                      type="text" 
                      value={dealershipName}
                      onChange={(e) => setDealershipName(e.target.value)}
                      className="w-full h-10 px-3 bg-muted/40 border border-border text-foreground text-sm focus:border-blue-500 rounded-lg outline-none focus:bg-card transition-all" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Support Email Address</label>
                    <input 
                      type="email" 
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      className="w-full h-10 px-3 bg-muted/40 border border-border text-foreground text-sm focus:border-blue-500 rounded-lg outline-none focus:bg-card transition-all" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Showroom Timezone</label>
                    <select 
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full h-10 px-3 bg-muted/40 border border-border text-foreground text-sm focus:border-blue-500 rounded-lg outline-none focus:bg-card transition-all cursor-pointer"
                    >
                      <option>Asia/Kolkata (IST)</option>
                      <option>UTC</option>
                      <option>America/New_York (EST)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Profile Settings Panel */}
            {activeTab === "profile" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h2 className="text-lg font-bold text-foreground">My Profile Settings</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Manage your personal identification, contact phone, and CRM access title.</p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Full Name</label>
                      <input 
                        type="text" 
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full h-10 px-3 bg-muted/40 border border-border text-foreground text-sm focus:border-blue-500 rounded-lg outline-none focus:bg-card transition-all" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">CRM Title</label>
                      <input 
                        type="text" 
                        value={isManager ? "Sales Manager & General Director" : "Senior Sales Advisor"} 
                        disabled
                        className="w-full h-10 px-3 bg-muted/20 border border-border/50 text-muted-foreground text-sm rounded-lg cursor-not-allowed opacity-60" 
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Contact Email</label>
                    <input 
                      type="email" 
                      value={personalEmail}
                      onChange={(e) => setPersonalEmail(e.target.value)}
                      className="w-full h-10 px-3 bg-muted/40 border border-border text-foreground text-sm focus:border-blue-500 rounded-lg outline-none focus:bg-card transition-all" 
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Panel */}
            {activeTab === "notifications" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    {isManager ? "Dealership Alerts & Targets" : "Notification Preferences"}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isManager 
                      ? "Configure lead follow-up timers, response targets, and dealership escalation alarms."
                      : "Control how and when you receive system alerts for incoming customer inquiries."
                    }
                  </p>
                </div>

                <div className="space-y-4">
                  {isManager ? (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Lead Response Goal Target</label>
                        <select 
                          value={slaTime}
                          onChange={(e) => setSlaTime(e.target.value)}
                          className="w-full h-10 px-3 bg-muted/40 border border-border text-foreground text-sm focus:border-blue-500 rounded-lg outline-none focus:bg-card transition-all cursor-pointer"
                        >
                          <option value="10m">10 Minutes (High-Speed Target)</option>
                          <option value="15m">15 Minutes (Standard SOP Target)</option>
                          <option value="30m">30 Minutes (Relaxed Target)</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Notification Dispatch Channels</label>
                        <div className="space-y-2 pt-1">
                          {[
                            "Push notifications on CRM Sales Intakes board",
                            "Desktop system audio ping",
                            "Auto-escalation email summary to general showroom inbox"
                          ].map((item, idx) => (
                            <label key={idx} className="flex items-center gap-2.5 text-xs text-foreground font-semibold cursor-pointer">
                              <input type="checkbox" defaultChecked className="accent-blue-600 size-3.5" />
                              <span>{item}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">My Notification Filters</label>
                        <div className="space-y-2 pt-1">
                          {[
                            "Alert me instantly when a lead is assigned to me",
                            "Play desktop audio ping for incoming messages",
                            "Daily email summary digest of outstanding checklist tasks"
                          ].map((item, idx) => (
                            <label key={idx} className="flex items-center gap-2.5 text-xs text-foreground font-semibold cursor-pointer">
                              <input type="checkbox" defaultChecked className="accent-blue-600 size-3.5" />
                              <span>{item}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Appearance Settings Panel */}
            {activeTab === "appearance" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Theme & Interface Settings</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Toggle interface themes to match your showroom lighting conditions.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Select Interface Theme</label>
                    <select 
                      value={selectedTheme}
                      onChange={(e) => setSelectedTheme(e.target.value)}
                      className="w-full h-10 px-3 bg-muted/40 border border-border text-foreground text-sm focus:border-blue-500 rounded-lg outline-none focus:bg-card transition-all cursor-pointer"
                    >
                      <option value="System">Synchronize with system default</option>
                      <option value="Light">Light Mode (Clean dashboard)</option>
                      <option value="Dark">Dark Mode (Premium deep blue theme)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Workspace Styling Options</label>
                    <div className="space-y-2 pt-1">
                      {[
                        "Enable high contrast layouts for dealership screens",
                        "Show sparkline widgets on main sales CRM boards",
                        "Compress sidebar for expanded workspace"
                      ].map((item, idx) => (
                        <label key={idx} className="flex items-center gap-2.5 text-xs text-foreground font-semibold cursor-pointer">
                          <input type="checkbox" defaultChecked={idx === 1} className="accent-blue-600 size-3.5" />
                          <span>{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Panel */}
            {activeTab === "security" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Account Security</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Modify your login credentials or view active credential parameters.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Current Password</label>
                    <input 
                      type="password" 
                      placeholder="••••••••" 
                      className="w-full h-10 px-3 bg-muted/40 border border-border text-foreground text-sm focus:border-blue-500 rounded-lg outline-none focus:bg-card transition-all" 
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">New Password</label>
                      <input 
                        type="password" 
                        placeholder="New Password" 
                        className="w-full h-10 px-3 bg-muted/40 border border-border text-foreground text-sm focus:border-blue-500 rounded-lg outline-none focus:bg-card transition-all" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Confirm New Password</label>
                      <input 
                        type="password" 
                        placeholder="Confirm Password" 
                        className="w-full h-10 px-3 bg-muted/40 border border-border text-foreground text-sm focus:border-blue-500 rounded-lg outline-none focus:bg-card transition-all" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Integrations Panel (Manager Only) */}
            {activeTab === "integrations" && isManager && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Integrations & API Desk</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Manage CRM data flows, WhatsApp gateways, and inbound webhooks.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">WhatsApp Gateway Auth API Key</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="password" 
                        value="hsrmotors_live_wa_key_883a99e12" 
                        disabled
                        className="flex-1 h-10 px-3 bg-muted/20 border border-border/50 text-muted-foreground text-sm rounded-lg cursor-not-allowed opacity-60" 
                      />
                      <button className="h-10 px-4 bg-muted border border-border hover:bg-muted/80 text-foreground text-xs font-bold rounded-lg cursor-pointer transition-colors">
                        Re-generate
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">CarDekho Webhook Ingestion URL</label>
                    <input 
                      type="text" 
                      value="https://api.driveflow.hsrmotors.com/ingest/cardekho-leads-sync" 
                      disabled
                      className="w-full h-10 px-3 bg-muted/20 border border-border/50 text-muted-foreground text-sm rounded-lg cursor-not-allowed opacity-60" 
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Save Button Row */}
            <div className="pt-4 border-t border-border flex justify-end">
              <button 
                onClick={handleSave}
                disabled={loading}
                className="h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all shadow-sm shadow-blue-600/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
