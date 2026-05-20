"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TemplateDialog } from "./TemplateDialog";

interface Template {
  id: string;
  name: string;
  channel: string;
  subject?: string;
  body: string;
  is_active: boolean;
  is_system: boolean;
  is_public: boolean;
  org_id: string | null;
}

export function TemplateList() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  async function fetchTemplates() {
    setLoading(true);
    try {
      const res = await fetch("/api/partner/automation/templates");
      const json = await res.json();
      if (res.ok) setTemplates(json.data || []);
    } catch (e) {
      console.error("Failed to fetch templates", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTemplates();
  }, []);

  if (loading && templates.length === 0) {
    return (
      <div className="flex items-center gap-3 p-8 rounded-2xl bg-muted/30 border border-border text-sm text-muted-foreground animate-pulse font-medium justify-center">
        <span className="icon-[solar--refresh-circle-bold-duotone] animate-spin text-primary size-5" /> 
        <span>Fetching templates…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Message Templates</h3>
        <Button 
          size="sm" 
          onClick={() => setIsCreateOpen(true)}
          className="h-8 rounded-xl font-black text-[9px] uppercase tracking-widest bg-primary/10 text-primary hover:bg-primary/20 border-none px-4"
        >
          <span className="icon-[solar--add-circle-bold-duotone] size-3.5 mr-2" />
          Create New
        </Button>
      </div>

      <TemplateDialog 
        open={isCreateOpen} 
        onOpenChange={setIsCreateOpen} 
        onSuccess={fetchTemplates} 
      />

      {templates.length === 0 ? (
        <div className="bg-card rounded-3xl border border-border p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center mx-auto mb-4">
             <span className="icon-[solar--document-text-bold-duotone] size-8" />
          </div>
          <h3 className="text-lg font-bold">No templates available</h3>
          <p className="text-muted-foreground text-xs max-w-xs mx-auto mt-1">
            Create your first custom template to get started with automated messaging.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((template) => (
            <div key={template.id} className="bg-card rounded-2xl border border-border p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
              <div className="flex items-start justify-between mb-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-black uppercase tracking-widest text-foreground group-hover:text-primary transition-colors">
                    {template.name}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2">
                     <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter h-5 border-primary/20 bg-primary/5 text-primary">
                        {template.channel}
                     </Badge>
                     {template.is_system ? (
                       <Badge className="text-[9px] font-black uppercase tracking-tighter h-5 bg-blue-500/10 text-blue-500 border-none">
                         System
                       </Badge>
                     ) : (
                       <>
                         <Badge className={cn(
                           "text-[9px] font-black uppercase tracking-tighter h-5 border-none",
                           template.is_active ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                         )}>
                           {template.is_active ? "Approved" : "Pending Approval"}
                         </Badge>
                         {template.is_public && template.is_active && (
                           <Badge className="text-[9px] font-black uppercase tracking-tighter h-5 bg-purple-500/10 text-purple-500 border-none">
                             Community Shared
                           </Badge>
                         )}
                       </>
                     )}
                  </div>
                </div>

                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                   <span className={cn(
                     template.channel === 'sms' ? "icon-[solar--plain-2-bold-duotone]" : 
                     template.channel === 'email' ? "icon-[solar--letter-bold-duotone]" : 
                     "icon-[solar--chat-line-bold-duotone]",
                     "size-4"
                   )} />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                 {template.subject && (
                   <p className="text-[10px] font-bold text-foreground mb-2 pb-2 border-b border-border/50">
                     Subject: {template.subject}
                   </p>
                 )}
                 <p className="text-xs text-muted-foreground leading-relaxed font-medium whitespace-pre-wrap italic line-clamp-4">
                    "{template.body}"
                 </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
