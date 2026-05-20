'use client'

import { useState } from 'react';
import { X, MoreHorizontal } from 'lucide-react';
import { updateLead } from '@/app/actions/leads';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function EditLeadDialog({ lead }: { lead: any }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      await updateLead(lead.id, {
        status: formData.get('status'),
        priority: formData.get('priority'),
        health: formData.get('health')
      });
      toast.success("Lead updated successfully");
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to update lead");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button 
        onClick={() => setOpen(true)}
        className="p-2 hover:bg-muted rounded-lg transition-colors" title="Manage Lead"
      >
        <MoreHorizontal className="size-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 text-left">
          <div className="bg-card border border-border w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-border">
              <h2 className="text-xl font-semibold">Manage Lead</h2>
              <button type="button" onClick={() => setOpen(false)} className="p-2 hover:bg-muted rounded-full">
                <X className="size-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2 text-center mb-6">
                 <p className="font-bold text-lg">{lead.name}</p>
                 <p className="text-sm text-muted-foreground">{lead.business_name || lead.email}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <select name="status" defaultValue={lead.status} className="w-full px-3 py-2 bg-muted rounded-lg border-transparent focus:border-blue-600 focus:bg-background outline-none transition-all">
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="negotiation">Negotiation</option>
                  <option value="converted">Converted</option>
                  <option value="completed">Completed</option>
                  <option value="lost">Lost</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Health</label>
                <select name="health" defaultValue={lead.health} className="w-full px-3 py-2 bg-muted rounded-lg border-transparent focus:border-blue-600 focus:bg-background outline-none transition-all">
                  <option value="hot">Hot</option>
                  <option value="warm">Warm</option>
                  <option value="cold">Cold</option>
                  <option value="stalled">Stalled</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <select name="priority" defaultValue={lead.priority} className="w-full px-3 py-2 bg-muted rounded-lg border-transparent focus:border-blue-600 focus:bg-background outline-none transition-all">
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 font-medium hover:bg-muted rounded-xl transition-colors">
                  Cancel
                </button>
                <button disabled={loading} type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-semibold transition-colors disabled:opacity-50">
                  {loading ? "Saving..." : "Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
