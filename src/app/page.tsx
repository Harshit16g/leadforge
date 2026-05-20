"use client";

import { useAuth, UserProfile } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Users, LayoutDashboard, ArrowRight } from "lucide-react";

export default function RoleSelectionPage() {
  const { loginAs } = useAuth();
  const router = useRouter();

  const handleSelectUser = (profile: UserProfile, redirect: string) => {
    loginAs(profile);
    router.push(redirect);
  };

  const usersList: { profile: UserProfile; description: string; redirect: string; color: string; hoverColor: string; bgLight: string; textLight: string }[] = [
    {
      profile: {
        id: "22222222-2222-2222-2222-222222222222",
        name: "Michael Chen",
        role: "manager"
      },
      description: "Access executive control, view funnel analytics, checklist templates, and configure dealership policies.",
      redirect: "/dashboard",
      color: "purple",
      hoverColor: "hover:border-purple-400 hover:shadow-purple-500/5",
      bgLight: "bg-purple-600/10",
      textLight: "text-purple-600"
    },
    {
      profile: {
        id: "11111111-1111-1111-1111-111111111111",
        name: "Sarah Jenkins",
        role: "sales"
      },
      description: "Sr. Sales Advisor dashboard. Qualify leads, complete checklist tasks, log interaction macros, and initiate chats.",
      redirect: "/leads",
      color: "blue",
      hoverColor: "hover:border-blue-400 hover:shadow-blue-500/5",
      bgLight: "bg-blue-600/10",
      textLight: "text-blue-600"
    },
    {
      profile: {
        id: "44444444-4444-4444-4444-444444444444",
        name: "Priya Sharma",
        role: "sales"
      },
      description: "Jr. Sales Advisor dashboard. Manage pipeline stages, update customer profiles, run similar conversion analyses.",
      redirect: "/leads",
      color: "emerald",
      hoverColor: "hover:border-emerald-400 hover:shadow-emerald-500/5",
      bgLight: "bg-emerald-600/10",
      textLight: "text-emerald-600"
    }
  ];

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-6 transition-colors duration-200 select-none">
      <div className="max-w-5xl w-full space-y-12">
        <div className="text-center space-y-3">
          <div className="inline-flex h-8 items-center justify-center rounded-full bg-blue-600/10 px-4 text-xs font-extrabold text-blue-600 uppercase tracking-widest">
            Prototype Sandbox v2.0
          </div>
          <h1 className="text-5xl font-black tracking-tight text-[#111827]">LeadForge Workspace</h1>
          <p className="text-base text-slate-500 font-bold max-w-xl mx-auto uppercase tracking-wide">
            Select an organization profile below to instant-login with click-to-go credentials.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {usersList.map((userConfig) => {
            const isManager = userConfig.profile.role === "manager";
            return (
              <button 
                key={userConfig.profile.id}
                onClick={() => handleSelectUser(userConfig.profile, userConfig.redirect)}
                className={`group block h-full text-left bg-white border border-slate-200 rounded-3xl p-8 transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1 cursor-pointer ${userConfig.hoverColor}`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-105 ${userConfig.bgLight} ${userConfig.textLight}`}>
                  {isManager ? <LayoutDashboard className="size-7" /> : <Users className="size-7" />}
                </div>

                <div className="space-y-1 mb-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {isManager ? "Management Console" : "Operations Desk"}
                  </span>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    {userConfig.profile.name}
                  </h2>
                  <p className="text-xs font-extrabold text-slate-400 uppercase">
                    {isManager ? "Lead Dealership Director" : userConfig.profile.id === "11111111-1111-1111-1111-111111111111" ? "Senior Sales Advisor" : "Junior Sales Advisor"}
                  </p>
                </div>

                <p className="text-slate-500 text-xs font-semibold leading-relaxed mb-8 min-h-[60px] opacity-80">
                  {userConfig.description}
                </p>

                <div className={`pt-4 border-t border-slate-100 flex items-center justify-between font-black text-xs uppercase tracking-wider ${userConfig.textLight}`}>
                  <span>Access Workspace</span>
                  <div className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <ArrowRight className="size-4" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
