import { PageHeader } from "@/components/common/PageHeader";
import { Plus, Megaphone, CheckCircle2, PauseCircle, Activity } from "lucide-react";

export default function CampaignsPage() {
  const campaigns = [
    { name: "Summer SUV Drive", platform: "Facebook", spend: "₹45,000", leads: 124, status: "active", cpl: "₹362" },
    { name: "Search Intent - Creta", platform: "Google Ads", spend: "₹82,500", leads: 89, status: "active", cpl: "₹926" },
    { name: "Weekend Walk-in Promo", platform: "Offline", spend: "₹15,000", leads: 42, status: "completed", cpl: "₹357" },
    { name: "Retargeting - Finance", platform: "Facebook", spend: "₹12,400", leads: 15, status: "paused", cpl: "₹826" },
  ];

  return (
    <div className="flex-1 h-full w-full overflow-y-auto pr-2 space-y-6 pb-12 max-w-[1440px] mx-auto scrollbar-thin">
      <PageHeader 
        title="Marketing Campaigns" 
        subtitle="Track your lead generation channels and ROI."
        actions={
          <button className="h-9 px-4 rounded-lg bg-blue-600 text-white font-medium text-sm flex items-center gap-2 hover:bg-blue-700 shadow-sm transition-colors">
            <Plus className="size-4" /> New Campaign
          </button>
        }
      />

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Campaign Name</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Platform</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Spend</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Leads Gen</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Cost per Lead</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {campaigns.map((camp, i) => (
              <tr key={i} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      camp.platform === 'Facebook' ? 'bg-blue-100 text-blue-600' :
                      camp.platform === 'Google Ads' ? 'bg-rose-100 text-rose-600' :
                      'bg-emerald-100 text-emerald-600'
                    }`}>
                      <Megaphone className="size-4" />
                    </div>
                    <span className="text-sm font-semibold text-slate-900">{camp.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 font-medium">{camp.platform}</td>
                <td className="px-6 py-4 text-sm text-slate-900 font-medium">{camp.spend}</td>
                <td className="px-6 py-4 text-sm font-bold text-slate-900">{camp.leads}</td>
                <td className="px-6 py-4 text-sm text-slate-600 font-medium">{camp.cpl}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                    camp.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    camp.status === 'paused' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    {camp.status === 'active' ? <Activity className="size-3" /> :
                     camp.status === 'paused' ? <PauseCircle className="size-3" /> :
                     <CheckCircle2 className="size-3" />}
                    <span className="capitalize">{camp.status}</span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
