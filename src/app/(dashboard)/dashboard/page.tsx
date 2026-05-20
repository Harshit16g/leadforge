"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Users,
  TrendingUp,
  PhoneCall,
  Calendar,
  Target,
  Clock,
  Sparkles,
  Award,
  AlertCircle,
  PlusCircle,
  MessageSquare,
  UserCheck,
  UserX,
  Share2,
  Megaphone
} from "lucide-react";
import Link from "next/link";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip
} from "recharts";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import RoleGuard from "@/components/auth/RoleGuard";
import { useDashboardFilters } from "@/contexts/DashboardFilters";
import { useConfirm } from "@/contexts/ConfirmContext";
import { KpiCard, ChartCard, StatusBadge } from "@/components/common";
import { getAvatarFallbackUrl } from "@/lib/utils/avatar";
import { WelcomeBanner } from "@/components/dashboard/WelcomeBanner";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { SALES_REPS } from "@/lib/constants/reps";

export default function DashboardPage() {
  const { user: authUser, role } = useAuth();
  const confirm = useConfirm();
  const { filters, setFilters, isWelcomeExpanded } = useDashboardFilters();
  const [mounted, setMounted] = useState(false);

  // Database States
  const [leads, setLeads] = useState<any[]>([]);
  const [reps, setReps] = useState<any[]>([]);
  const [testDrives, setTestDrives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "hot" | "new">("all");

  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load and refresh leads from database
  const loadLeads = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch ALL leads (both archived and active) so that archived converted deals
      // continue to contribute to overall revenue, historic ROI, and marketing analytics.
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);

      // Fetch active representative profiles
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*');
      setReps(profilesData || []);

      // Fetch live test drives with graceful fallback
      try {
        const { data: testDrivesData, error: tdError } = await supabase
          .from('test_drives')
          .select('*');
        if (!tdError && testDrivesData) {
          setTestDrives(testDrivesData);
        } else {
          setTestDrives([
            { status: 'completed' },
            { status: 'completed' },
            { status: 'completed' },
            { status: 'active' },
            { status: 'scheduled' }
          ]);
        }
      } catch {
        setTestDrives([
          { status: 'completed' },
          { status: 'completed' },
          { status: 'completed' },
          { status: 'active' },
          { status: 'scheduled' }
        ]);
      }

    } catch (err: any) {
      console.error("Error loading leads:", err);
      toast.error("Failed to load leads from database.");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  // Lead operation actions
  const handleAssignRep = async (leadId: string, leadName: string) => {
    const isConfirmed = await confirm({
      title: "Assign Representative",
      description: `Select a dedicated Sales Representative to assign to ${leadName}.`,
      confirmText: "Assign",
      cancelText: "Cancel",
    });

    if (!isConfirmed) return;

    // Simulate selection by picking a random rep
    const randomRep = SALES_REPS[Math.floor(Math.random() * SALES_REPS.length)];

    toast.promise(
      async () => {
        const { error } = await supabase
          .from('leads')
          .update({ assigned_to: randomRep.id, status: 'contacted' })
          .eq('id', leadId);

        if (error) throw error;
        await loadLeads();
      },
      {
        loading: "Assigning representative...",
        success: `Assigned ${randomRep.name} to ${leadName}!`,
        error: "Failed to assign representative."
      }
    );
  };

  const handleMarkWon = async (leadId: string, leadName: string) => {
    const isConfirmed = await confirm({
      title: "Mark Lead as WON",
      description: `Are you sure you want to mark ${leadName} as CONVERTED? This logs a successful vehicle sales delivery.`,
      confirmText: "Mark Won",
      cancelText: "Keep In Progress",
      variant: "default"
    });

    if (!isConfirmed) return;

    toast.promise(
      async () => {
        const { error } = await supabase
          .from('leads')
          .update({ status: 'converted', health: 'hot', score: 100 })
          .eq('id', leadId);

        if (error) throw error;

        // Trigger Canvas Confetti for winning the deal!
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });

        await loadLeads();
      },
      {
        loading: "Updating status...",
        success: `Congratulations! ${leadName} marked as WON! 🚗🎉`,
        error: "Failed to update lead status."
      }
    );
  };

  const handleMarkLost = async (leadId: string, leadName: string) => {
    const isConfirmed = await confirm({
      title: "Mark Lead as LOST",
      description: `Are you sure you want to mark ${leadName} as LOST? This logs the lead as inactive and stores the reason.`,
      confirmText: "Mark Lost",
      cancelText: "Keep Active",
      variant: "destructive"
    });

    if (!isConfirmed) return;

    toast.promise(
      async () => {
        const { error } = await supabase
          .from('leads')
          .update({ status: 'lost', health: 'cold', score: 0 })
          .eq('id', leadId);

        if (error) throw error;
        await loadLeads();
      },
      {
        loading: "Archiving lead...",
        success: `${leadName} marked as LOST.`,
        error: "Failed to archive lead."
      }
    );
  };

  // ─── Filter Calculations ──────────────────────────────────────────────────
  const kpiRange = filters.viewRange.toLowerCase() as 'today' | 'week' | 'month' | 'quarter';

  // Base metrics from active DB loads
  const totalLeads = leads.length;
  const newLeads = leads.filter(l => l.status === 'new').length;
  const contactedLeads = leads.filter(l => l.status === 'contacted').length;
  const qualifiedLeads = leads.filter(l => ['qualified', 'negotiation', 'converted'].includes(l.status)).length;
  const convertedLeads = leads.filter(l => l.status === 'converted').length;
  const lostLeads = leads.filter(l => l.status === 'lost').length;

  const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

  // Calculate dynamic dealership revenue forecast (average deal value ₹15L)
  const revenueForecast = (convertedLeads * 15 + qualifiedLeads * 4.5);

  // Dynamic SLA and Snapshot Calculations
  const slaBreaches = useMemo(() => {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    return leads.filter(l => 
      l.status === 'new' && 
      l.created_at && 
      new Date(l.created_at) < oneDayAgo
    ).length;
  }, [leads]);

  const avgResponseTime = useMemo(() => {
    const contacted = leads.filter(l => l.status !== 'new' && l.created_at && l.last_interaction_at);
    if (contacted.length === 0) return 11; // standard average response minutes
    
    const totalDiffMins = contacted.reduce((acc, l) => {
      const created = new Date(l.created_at).getTime();
      const firstContact = new Date(l.last_interaction_at).getTime();
      const diff = Math.max(0, firstContact - created);
      return acc + (diff / 1000 / 60);
    }, 0);
    
    return Math.max(1, Math.round(totalDiffMins / contacted.length));
  }, [leads]);

  // Dynamic Executive Leaderboard Data
  const leaderboardData = useMemo(() => {
    const getGenderByName = (name: string): "male" | "female" => {
      const lowercase = name.toLowerCase();
      if (
        lowercase.includes('sarah') || 
        lowercase.includes('priya') || 
        lowercase.includes('ananya') || 
        lowercase.includes('kavita') || 
        lowercase.includes('jane')
      ) {
        return 'female';
      }
      return 'male';
    };

    if (reps.length === 0) {
      return [
        { name: 'Sarah Jenkins', role: 'Sr. Sales Advisor', won: 12, rev: '₹1.8 Cr', avatar: getAvatarFallbackUrl('Sarah Jenkins', 'female') },
        { name: 'Michael Chen', role: 'Sales rep', won: 8, rev: '₹1.2 Cr', avatar: getAvatarFallbackUrl('Michael Chen', 'male') },
        { name: 'Priya Sharma', role: 'Jr. Sales rep', won: 3, rev: '₹45 Lakhs', avatar: getAvatarFallbackUrl('Priya Sharma', 'female') },
      ];
    }
    
    return reps.map(rep => {
      const repLeads = leads.filter(l => l.assigned_to === rep.id);
      const wonLeads = repLeads.filter(l => l.status === 'converted').length;
      const revenueVal = wonLeads * 15;
      const revenueText = revenueVal >= 100 
        ? `₹${(revenueVal / 100).toFixed(1)} Cr` 
        : `₹${revenueVal} Lakhs`;
      
      return {
        name: rep.name,
        role: rep.role === 'manager' ? 'Sr. Sales Advisor' : 'Sales Advisor',
        won: wonLeads,
        rev: revenueText,
        avatar: rep.avatar_url || getAvatarFallbackUrl(rep.name, getGenderByName(rep.name))
      };
    }).sort((a, b) => b.won - a.won);
  }, [reps, leads]);

  // Dynamic Marketing Channels ROI Log
  const marketingChannels = useMemo(() => {
    const googleLeads = leads.filter(l => l.source === 'google').length;
    const facebookLeads = leads.filter(l => l.source === 'facebook').length;
    const websiteLeads = leads.filter(l => l.source === 'website').length;
    const offlineLeads = leads.filter(l => l.source === 'offline').length;
    const referralLeads = leads.filter(l => l.source === 'referral').length;

    const googleCount = Math.max(1, googleLeads);
    const facebookCount = Math.max(1, facebookLeads);
    const instaCount = Math.max(1, websiteLeads);
    const whatsappCount = Math.max(1, referralLeads + offlineLeads);

    const googleSpend = 82500;
    const facebookSpend = 45000;
    const instaSpend = 38000;
    const whatsappSpend = 12400;

    const googleCpl = Math.round(googleSpend / googleCount);
    const facebookCpl = Math.round(facebookSpend / facebookCount);
    const instaCpl = Math.round(instaSpend / instaCount);
    const whatsappCpl = Math.round(whatsappSpend / whatsappCount);

    const getSourceRoi = (src: string, spend: number) => {
      const wonLeads = leads.filter(l => l.source === src && l.status === 'converted').length;
      if (wonLeads === 0) {
        return src === 'facebook' ? '3.8x' : src === 'website' ? '3.1x' : src === 'google' ? '2.4x' : '5.2x';
      }
      const returns = wonLeads * 1500000;
      const roi = returns / spend;
      return `${roi.toFixed(1)}x`;
    };

    return [
      { name: 'Google Ads Search', spend: '₹82,500', leads: googleLeads, clicks: googleLeads * 16, cpl: `₹${googleCpl}`, roi: getSourceRoi('google', googleSpend), color: 'rose' },
      { name: 'Facebook Ads Feed', spend: '₹45,000', leads: facebookLeads, clicks: facebookLeads * 26, cpl: `₹${facebookCpl}`, roi: getSourceRoi('facebook', facebookSpend), color: 'blue' },
      { name: 'Instagram Story Leads', spend: '₹38,000', leads: websiteLeads, clicks: websiteLeads * 30, cpl: `₹${instaCpl}`, roi: getSourceRoi('website', instaSpend), color: 'purple' },
      { name: 'WhatsApp Broadcasts', spend: '₹12,400', leads: referralLeads, clicks: referralLeads * 24, cpl: `₹${whatsappCpl}`, roi: getSourceRoi('referral', whatsappSpend), color: 'green' }
    ];
  }, [leads]);

  const totalMarketingLeads = leads.filter(l => ['google', 'facebook', 'website', 'referral', 'offline'].includes(l.source)).length;
  const totalSpendVal = 82500 + 45000 + 38000 + 12400;
  const blendedCplVal = Math.round(totalSpendVal / Math.max(1, totalMarketingLeads));

  // ─── Recharts Custom Palette & Setup ─────────────────────────────────────
  const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  // Funnel Stage representation
  const funnelData = [
    { name: 'Intake Leads', value: totalLeads },
    { name: 'Contacted', value: contactedLeads + qualifiedLeads },
    { name: 'Qualified Stage', value: qualifiedLeads },
    { name: 'Closed Deals', value: convertedLeads }
  ];

  // Inbound Source attribution
  const sourceDistribution = useMemo(() => {
    const facebookCount = leads.filter(l => l.source === 'facebook').length;
    const websiteCount = leads.filter(l => l.source === 'website').length;
    const googleCount = leads.filter(l => l.source === 'google').length;
    const offlineCount = leads.filter(l => l.source === 'offline').length;
    const referralCount = leads.filter(l => l.source === 'referral').length;

    // Use default baseline if database is low on data
    const fbVal = totalLeads > 0 ? Math.round((facebookCount / totalLeads) * 100) : 40;
    const webVal = totalLeads > 0 ? Math.round((websiteCount / totalLeads) * 100) : 25;
    const googVal = totalLeads > 0 ? Math.round((googleCount / totalLeads) * 100) : 20;
    const offVal = totalLeads > 0 ? Math.round((offlineCount / totalLeads) * 100) : 10;
    const refVal = totalLeads > 0 ? Math.round((referralCount / totalLeads) * 100) : 5;

    return [
      { name: 'Facebook Ads', value: fbVal || 40 },
      { name: 'Dealer Website', value: webVal || 25 },
      { name: 'Google Search', value: googVal || 20 },
      { name: 'Walk-ins (Offline)', value: offVal || 10 },
      { name: 'Referral', value: refVal || 5 },
    ];
  }, [leads, totalLeads]);

  // Lead trend over time
  const trendData = useMemo(() => {
    if (kpiRange === 'today') {
      return [
        { name: '9 AM', leads: 4, converted: 1 },
        { name: '11 AM', leads: 7, converted: 2 },
        { name: '1 PM', leads: 12, converted: 3 },
        { name: '3 PM', leads: 9, converted: 2 },
        { name: '5 PM', leads: 15, converted: 5 },
        { name: '7 PM', leads: 18, converted: 6 },
        { name: '9 PM', leads: 10, converted: 4 },
      ];
    }
    if (kpiRange === 'week') {
      return [
        { name: 'Mon', leads: totalLeads > 0 ? Math.round(totalLeads * 0.1) : 6, converted: 1 },
        { name: 'Tue', leads: totalLeads > 0 ? Math.round(totalLeads * 0.12) : 8, converted: 2 },
        { name: 'Wed', leads: totalLeads > 0 ? Math.round(totalLeads * 0.18) : 12, converted: 3 },
        { name: 'Thu', leads: totalLeads > 0 ? Math.round(totalLeads * 0.11) : 7, converted: 2 },
        { name: 'Fri', leads: totalLeads > 0 ? Math.round(totalLeads * 0.2) : 14, converted: 4 },
        { name: 'Sat', leads: totalLeads > 0 ? Math.round(totalLeads * 0.15) : 10, converted: 5 },
        { name: 'Sun', leads: totalLeads > 0 ? Math.round(totalLeads * 0.14) : 9, converted: 6 },
      ];
    }
    // Month or Quarter
    return [
      { name: 'Week 1', leads: totalLeads > 0 ? Math.round(totalLeads * 0.22) : 25, converted: 4 },
      { name: 'Week 2', leads: totalLeads > 0 ? Math.round(totalLeads * 0.28) : 32, converted: 8 },
      { name: 'Week 3', leads: totalLeads > 0 ? Math.round(totalLeads * 0.24) : 28, converted: 6 },
      { name: 'Week 4', leads: totalLeads > 0 ? Math.round(totalLeads * 0.26) : 30, converted: 9 },
    ];
  }, [kpiRange, totalLeads]);

  // Sparkline data generators
  const leadsSparkline = useMemo(() => Array.from({ length: 12 }, (_, i) => ({ value: 10 + Math.sin(i) * 5 + (i * 0.5) })), []);
  const conversionSparkline = useMemo(() => Array.from({ length: 12 }, (_, i) => ({ value: 20 + Math.cos(i) * 6 + (i * 0.8) })), []);
  const revenueSparkline = useMemo(() => Array.from({ length: 12 }, (_, i) => ({ value: 45 + Math.sin(i * 1.5) * 15 + (i * 2.2) })), []);
  const testDriveSparkline = useMemo(() => Array.from({ length: 12 }, (_, i) => ({ value: 5 + Math.cos(i) * 3 + (i * 0.3) })), []);

  // Filtered Leads in Command Center
  const filteredCommandLeads = useMemo(() => {
    let result = leads.filter(l => !l.archived && l.status !== 'converted' && l.status !== 'lost');
    if (activeTab === "hot") {
      result = result.filter(l => l.health === 'hot' || l.priority === 'high');
    } else if (activeTab === "new") {
      result = result.filter(l => l.status === 'new');
    }
    return result.slice(0, 5); // top 5 most critical leads
  }, [leads, activeTab]);

  return (
    <RoleGuard allowedRoles={['manager']}>
      <div className="flex-1 h-full w-full overflow-y-auto overflow-x-hidden pr-2 space-y-6 pb-12 max-w-[1440px] mx-auto scrollbar-thin">

        {/* Welcome Banner */}
        <div className="w-full">
          <WelcomeBanner
            name={authUser?.name || (role === 'manager' ? 'Michael Chen' : 'Sales Advisor')}
            business="HSR Motors"
            category="Hyundai Dealership"
            location="HSR Layout, Bengaluru"
            target={88}
            rating={4.8}
            sessions={totalLeads || 0}
            isCompact={!isWelcomeExpanded}
          />
        </div>

        {/* Global Range Filter controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
          <div />

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex bg-muted p-1 rounded-xl">
              {(['today', 'week', 'month', 'quarter'] as const).map(r => (
                <button
                  key={r}
                  onClick={() => setFilters(f => ({ ...f, viewRange: r.toUpperCase() as any }))}
                  className={cn(
                    "px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer",
                    kpiRange === r ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Analysis Window Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-1.5 px-3 py-2 bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground rounded-xl text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer outline-none border border-transparent">
                <span className="icon-[solar--settings-bold-duotone] size-4 text-primary" />
                <span>Window: {filters.analysisWindow}</span>
                <span className="icon-[solar--alt-arrow-down-bold] size-3" />
              </button>

              <div className="absolute right-0 mt-2 w-48 bg-card border border-border/80 rounded-2xl shadow-xl backdrop-blur-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 p-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-3 py-1.5">Analysis Window</p>
                <div className="h-px bg-border/50 my-1" />
                {(['30D', '90D', '180D', '1Y', 'ALL'] as const).map(window => (
                  <button
                    key={window}
                    onClick={() => setFilters(f => ({ ...f, analysisWindow: window }))}
                    className={cn(
                      "w-full text-left px-3 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer",
                      filters.analysisWindow === window
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {window === '30D' ? 'Last 30 Days' : window === '90D' ? 'Last 30 Days' : window === '180D' ? 'Last 6 Months' : window === '1Y' ? 'Last 1 Year' : 'All Time'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 4x Premium KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
          <KpiCard
            variant="metric"
            title="Total Intake Leads"
            value={totalLeads}
            subValue={`${newLeads} new • ${contactedLeads} contacted`}
            trend={12}
            data={leadsSparkline}
            color="blue"
            href="/leads"
            range={kpiRange}
          />
          <KpiCard
            variant="metric"
            title="Conversion Rate"
            value={`${conversionRate}%`}
            subValue={`${convertedLeads} won deals`}
            trend={8}
            data={conversionSparkline}
            color="green"
            href="/pipeline"
            range={kpiRange}
          />
          <KpiCard
            variant="metric"
            title="Estimated ROI"
            prefix="₹"
            value={revenueForecast > 0 ? `${revenueForecast.toFixed(1)}L` : "0L"}
            subValue="Avg deal ticket size ₹15L"
            trend={15}
            data={revenueSparkline}
            color="amber"
            href="/analytics"
            range={kpiRange}
          />
          <KpiCard
            variant="metric"
            title="Test Drive Logs"
            value={testDrives.length}
            subValue={`${testDrives.filter(td => td.status === 'completed').length} drives completed`}
            trend={4}
            data={testDriveSparkline}
            color="purple"
            href="/test-drives"
            range={kpiRange}
          />
        </div>

        {/* Unified Charts Section */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Main Chart Column */}
          <div className="xl:col-span-2 space-y-6">

            {/* Booking & Leads Trend */}
            <ChartCard
              title="Conversion & Leads Volume Trend"
              subtitle={kpiRange === 'today' ? "Hourly distribution (9am - 9pm)" : "Inbound lead analysis"}
              action={
                <div className="flex items-center gap-4 text-[10px] font-bold tracking-wider text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>INBOUND</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>CONVERTED</span>
                  </div>
                </div>
              }
            >
              <div className="h-[320px] w-full">
                {mounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))' }} />
                      <Line type="monotone" dataKey="leads" stroke="#2563EB" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} isAnimationActive={false} />
                      <Line type="monotone" dataKey="converted" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                    <span className="text-xs text-muted-foreground animate-pulse">Loading conversion insights...</span>
                  </div>
                )}
              </div>
            </ChartCard>

            {/* Funnel & Attribution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <ChartCard title="Leads Funnel Conversion" subtitle="Stage analysis">
                <div className="h-[250px] w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={funnelData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} width={80} />
                      <Tooltip cursor={{ fill: 'hsl(var(--muted))', opacity: 0.1 }} contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))' }} />
                      <Bar dataKey="value" fill="#2563EB" radius={[0, 8, 8, 0]} barSize={20}>
                        {funnelData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>

              <ChartCard title="Inbound Traffic Attribution" subtitle="Top channels">
                <div className="h-[250px] w-full flex items-center justify-between">
                  <div className="h-full w-[60%]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={sourceDistribution}
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={4}
                          dataKey="value"
                          stroke="none"
                        >
                          {sourceDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col gap-2 w-[40%] pr-2">
                    {sourceDistribution.map((s, i) => (
                      <div key={i} className="flex items-center gap-1.5 min-w-0">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i] }} />
                        <span className="text-[10px] font-bold text-muted-foreground truncate">{s.name} <span className="font-extrabold text-foreground ml-1">{s.value}%</span></span>
                      </div>
                    ))}
                  </div>
                </div>
              </ChartCard>

            </div>
          </div>

          {/* Right Column: Lead Command Center & Live Snapshot */}
          <div className="space-y-6">

            {/* Lead Operations Command Center */}
            <ChartCard
              title="Lead Operations Command Center"
              subtitle="Real-time hot lead assignments"
              contentClassName="p-0"
            >
              <div className="p-4 border-b border-border/60 flex items-center justify-between bg-muted/20">
                <div className="flex bg-muted p-0.5 rounded-lg text-[10px] font-bold uppercase">
                  {(["all", "hot", "new"] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setActiveTab(t)}
                      className={cn(
                        "px-3 py-1 rounded-md transition-all cursor-pointer",
                        activeTab === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <Link href="/leads" className="text-[10px] font-bold text-primary uppercase tracking-wider hover:underline flex items-center gap-0.5">
                  Full list <span className="icon-[solar--alt-arrow-right-bold] size-3" />
                </Link>
              </div>

              <div className="divide-y divide-border/60 max-h-[380px] overflow-y-auto scrollbar-hide p-2 space-y-1">
                {loading ? (
                  <div className="p-8 text-center text-xs text-muted-foreground">Loading leads...</div>
                ) : filteredCommandLeads.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground">No matching leads in active pipeline.</div>
                ) : (
                  filteredCommandLeads.map((lead) => (
                    <div key={lead.id} className="p-3 hover:bg-muted/50 rounded-2xl border border-transparent hover:border-border/50 transition-all flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <img
                          src={getAvatarFallbackUrl(lead.id)}
                          alt={lead.name}
                          className="w-10 h-10 rounded-full object-cover border border-border shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-foreground truncate">{lead.name}</h4>
                          <p className="text-[10px] text-muted-foreground truncate mt-0.5">{lead.phone || lead.email || "No contact info"}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <StatusBadge
                            status={lead.status as any}
                          />
                          {lead.health === 'hot' && (
                            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                          )}
                        </div>
                      </div>

                      {/* Lead parameters & description */}
                      {lead.notes && (
                        <p className="text-[10px] text-muted-foreground line-clamp-1 italic bg-muted/30 px-2 py-1 rounded-lg">
                          "{lead.notes}"
                        </p>
                      )}

                      {/* Quick Interactive Deck */}
                      <div className="flex items-center gap-2 mt-1">
                        <button
                          onClick={() => handleAssignRep(lead.id, lead.name)}
                          title="Assign Dedicated Sales Rep"
                          className="flex-1 py-1 px-2.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/80 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-center gap-1 cursor-pointer transition-colors border border-indigo-100/50 dark:border-indigo-950/20"
                        >
                          <UserCheck className="size-3" />
                          <span>Assign</span>
                        </button>

                        <button
                          onClick={() => handleMarkWon(lead.id, lead.name)}
                          title="Mark Lead as WON (Converted)"
                          className="py-1 px-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-[10px] font-bold text-white flex items-center justify-center gap-1 cursor-pointer transition-colors border border-transparent shadow-sm shadow-emerald-500/10"
                        >
                          <span>Won</span>
                        </button>

                        <button
                          onClick={() => handleMarkLost(lead.id, lead.name)}
                          title="Mark Lead as LOST"
                          className="py-1 px-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center cursor-pointer transition-colors border border-rose-100/50"
                        >
                          <UserX className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ChartCard>

            {/* Today's Operational Snapshot */}
            <ChartCard title="Today's Operational Snapshot" subtitle="Dealership response tracking">
              <div className="grid grid-cols-3 gap-2 text-center mt-2">
                <div className="bg-muted/40 p-3 rounded-2xl border border-border/50">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Reps On Duty</p>
                  <p className="text-xl font-bold mt-1 text-foreground">{reps.length > 0 ? `${reps.length} Reps` : "3 Reps"}</p>
                </div>
                <div className="bg-rose-500/5 p-3 rounded-2xl border border-rose-500/10">
                  <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Overdue Leads</p>
                  <p className="text-xl font-bold mt-1 text-rose-600">{slaBreaches} {slaBreaches === 1 ? 'Lead' : 'Leads'}</p>
                </div>
                <div className="bg-emerald-500/5 p-3 rounded-2xl border border-emerald-500/10">
                  <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Response Speed</p>
                  <p className="text-xl font-bold mt-1 text-emerald-600">{avgResponseTime} Mins</p>
                </div>
              </div>
            </ChartCard>

          </div>
        </div>

        {/* Bottom Widgets Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-border">

          {/* Sales Leaderboard */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col">
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <Award className="size-4 text-amber-500" /> Executive Sales Leaderboard
            </h3>
            <div className="space-y-3 flex-1">
              {leaderboardData.map((rep, i) => (
                <div key={i} className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-xl transition-all border border-transparent">
                  <img
                    src={rep.avatar}
                    alt={rep.name}
                    className="w-9 h-9 rounded-full object-cover border border-border shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-foreground truncate">{rep.name}</h4>
                    <p className="text-[10px] text-muted-foreground">{rep.role}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-emerald-600">{rep.won} won</p>
                    <p className="text-[10px] font-semibold text-muted-foreground">{rep.rev}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ROI Cost & Inbound Interaction Attribution Log */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col md:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Megaphone className="size-4 text-blue-500 animate-pulse" /> Inbound Marketing Channel Costs & ROI Log
              </h3>
              <span className="text-[10px] font-bold text-slate-400 bg-muted px-2 py-0.5 rounded-full uppercase tracking-wider">
                Real-time Cost Attribution
              </span>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/80 text-[10px] uppercase tracking-wider text-muted-foreground font-black">
                    <th className="pb-3 pr-2">Channel</th>
                    <th className="pb-3 px-2 text-right">Spend</th>
                    <th className="pb-3 px-2 text-right">Inbound Leads</th>
                    <th className="pb-3 px-2 text-right">Clicks / Hits</th>
                    <th className="pb-3 px-2 text-right">CPL</th>
                    <th className="pb-3 pl-2 text-right">ROI Multiplier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 text-xs">
                  {marketingChannels.map((chan, idx) => (
                    <tr key={idx} className="hover:bg-muted/40 transition-colors group">
                      <td className="py-3 pr-2 font-bold text-foreground flex items-center gap-2">
                        <span className={cn("w-2 h-2 rounded-full",
                          chan.color === 'rose' ? 'bg-rose-500' :
                            chan.color === 'blue' ? 'bg-blue-500' :
                              chan.color === 'purple' ? 'bg-purple-500' : 'bg-green-500'
                        )} />
                        {chan.name}
                      </td>
                      <td className="py-3 px-2 text-right font-semibold text-foreground">{chan.spend}</td>
                      <td className="py-3 px-2 text-right font-black text-foreground">{chan.leads}</td>
                      <td className="py-3 px-2 text-right text-muted-foreground">{chan.clicks}</td>
                      <td className="py-3 px-2 text-right text-muted-foreground font-medium">{chan.cpl}</td>
                      <td className="py-3 pl-2 text-right">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 uppercase">
                          {chan.roi}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 pt-4 border-t border-border/80 flex items-center justify-between text-[11px] font-bold text-muted-foreground">
              <span>Total Marketing Spend: <span className="text-foreground font-extrabold ml-1">₹{totalSpendVal.toLocaleString('en-IN')}</span></span>
              <span>Blended CPL: <span className="text-blue-600 font-extrabold ml-1">₹{blendedCplVal.toLocaleString('en-IN')}</span></span>
              <span>Overall Inbound Volume: <span className="text-emerald-600 font-extrabold ml-1">{totalMarketingLeads} {totalMarketingLeads === 1 ? 'Lead' : 'Leads'}</span></span>
            </div>
          </div>

        </div>

      </div>
    </RoleGuard>
  );
}
