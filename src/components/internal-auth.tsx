"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { SignupForm } from "@/components/signup-form";
import { cn } from "@/lib/utils";

export function InternalAuth({ mode = "login" }: { mode?: "login" | "signup" }) {
  const searchParams = useSearchParams();
  const paramMode = searchParams.get("mode") as "login" | "signup" | null;
  const [activeTab, setActiveTab] = useState<"login" | "signup">(paramMode ?? mode);

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-6 md:p-10 relative overflow-hidden">
      {/* Decorative backgrounds */}
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-500 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-sm md:max-w-3xl relative z-10">
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="size-12 rounded-2xl bg-primary text-primary-foreground font-black text-2xl flex items-center justify-center shadow-xl shadow-primary/20">L</div>
          <h1 className="text-xl font-black tracking-tight text-foreground">LEAEX CONSOLE</h1>
          <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest bg-muted px-4 py-1.5 rounded-full border border-border">Management Portal</p>
        </div>

        <div className="transition-all duration-500 ease-in-out">
          {activeTab === "login" ? (
            <LoginForm
              showSignupLink={false}
              className="animate-in fade-in slide-in-from-bottom-4 duration-500"
            />
          ) : (
            <SignupForm className="animate-in fade-in slide-in-from-bottom-4 duration-500" />
          )}
        </div>

        <div className="mt-8 flex justify-center">
          <button
            onClick={() => setActiveTab(activeTab === "login" ? "signup" : "login")}
            className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group"
          >
            {activeTab === "login" ? (
              <>
                <span>New Partner? Register your salon</span>
                <span className="icon-[solar--arrow-right-linear] transition-transform group-hover:translate-x-1" />
              </>
            ) : (
              <>
                <span className="icon-[solar--arrow-left-linear] transition-transform group-hover:-translate-x-1" />
                <span>Back to Employee & Admin Login</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="mt-12 text-center relative z-10">
        <p className="text-[10px] text-muted-foreground font-medium opacity-50 uppercase tracking-[0.2em]">
          Initializing.&copy; {new Date().getFullYear()} Leaex Platform
        </p>
      </div>
    </div>
  );
}
