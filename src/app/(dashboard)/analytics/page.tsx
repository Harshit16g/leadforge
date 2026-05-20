"use client";

import { PageHeader } from "@/components/common/PageHeader";
import { Download, Filter } from "lucide-react";
import { LineChart, Line, BarChart, Bar, ResponsiveContainer, XAxis, Tooltip, CartesianGrid } from "recharts";

const performanceData = [
  { month: 'Jan', revenue: 45, target: 50 },
  { month: 'Feb', revenue: 52, target: 50 },
  { month: 'Mar', revenue: 48, target: 55 },
  { month: 'Apr', revenue: 61, target: 55 },
  { month: 'May', revenue: 59, target: 60 },
  { month: 'Jun', revenue: 68, target: 60 },
];

const sourcePerformanceData = [
  { name: 'Google Search', leads: 420, convRate: 24 },
  { name: 'Facebook Ads', leads: 380, convRate: 18 },
  { name: 'Walk-ins', leads: 150, convRate: 45 },
  { name: 'Referrals', leads: 85, convRate: 62 },
];

export default function AnalyticsPage() {
  return (
    <div className="flex-1 h-full w-full overflow-y-auto pr-2 space-y-6 pb-12 max-w-[1440px] mx-auto scrollbar-thin">
      <PageHeader 
        title="Analytics & Reporting" 
        subtitle="Deep dive into dealership performance metrics."
        actions={
          <div className="flex gap-2">
            <button className="h-9 px-4 rounded-lg bg-white border border-slate-200 text-slate-700 font-medium text-sm flex items-center gap-2 hover:bg-slate-50 shadow-sm transition-colors">
              <Filter className="size-4" /> This Quarter
            </button>
            <button className="h-9 px-4 rounded-lg bg-blue-600 text-white font-medium text-sm flex items-center gap-2 hover:bg-blue-700 shadow-sm transition-colors">
              <Download className="size-4" /> Export Report
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-6">Revenue vs Target (Lakhs)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                <Line type="monotone" dataKey="target" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                <Line type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-6">Lead Volume by Source</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sourcePerformanceData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                <Bar dataKey="leads" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
