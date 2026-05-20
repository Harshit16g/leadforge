import { PageHeader } from "@/components/common/PageHeader";
import { Plus, Users, TrendingUp, Target } from "lucide-react";

export default function TeamPage() {
  const team = [
    { name: "Sarah Jenkins", role: "Sr. Sales Manager", leads: 45, conv: "32%", status: "online", avatar: "S" },
    { name: "Michael Chen", role: "Sales Rep", leads: 38, conv: "28%", status: "online", avatar: "M" },
    { name: "David Kumar", role: "Sales Rep", leads: 42, conv: "24%", status: "offline", avatar: "D" },
    { name: "Priya Sharma", role: "Jr. Sales", leads: 28, conv: "18%", status: "online", avatar: "P" },
    { name: "Alex Thompson", role: "BDR", leads: 56, conv: "12%", status: "offline", avatar: "A" },
  ];

  return (
    <div className="flex-1 h-full w-full overflow-y-auto pr-2 space-y-6 pb-12 max-w-[1440px] mx-auto scrollbar-thin">
      <PageHeader 
        title="Team Directory" 
        subtitle="Manage your sales team and monitor individual performance."
        actions={
          <button className="h-9 px-4 rounded-lg bg-blue-600 text-white font-medium text-sm flex items-center gap-2 hover:bg-blue-700 shadow-sm transition-colors">
            <Plus className="size-4" /> Add Member
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
            <Users className="size-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500">Total Members</p>
            <p className="text-2xl font-bold text-slate-900">12</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
            <Target className="size-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500">Active Reps</p>
            <p className="text-2xl font-bold text-slate-900">8</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
            <TrendingUp className="size-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500">Avg. Conversion</p>
            <p className="text-2xl font-bold text-slate-900">22.8%</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Member</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Leads</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Win Rate</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {team.map((member, i) => (
              <tr key={i} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold">
                        {member.avatar}
                      </div>
                      <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${member.status === 'online' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{member.name}</p>
                      <p className="text-xs text-slate-500">{member.name.toLowerCase().replace(' ', '.')}@hsrmotors.com</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 font-medium">{member.role}</td>
                <td className="px-6 py-4 text-sm font-bold text-slate-900">{member.leads}</td>
                <td className="px-6 py-4 text-sm font-bold text-emerald-600">{member.conv}</td>
                <td className="px-6 py-4 text-right">
                  <button className="text-sm text-blue-600 font-medium hover:underline">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
