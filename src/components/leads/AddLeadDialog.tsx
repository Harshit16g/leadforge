'use client'

import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { createLead } from '@/app/actions/leads';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function AddLeadDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<'sales' | 'manager'>('sales');
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined' && open) {
      const savedRole = localStorage.getItem('leadforge_role') as 'sales' | 'manager';
      if (savedRole) setRole(savedRole);
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      await createLead(formData);
      toast.success("Lead created successfully");
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to create lead");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button 
        onClick={() => setOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold transition-colors flex items-center gap-2"
      >
        <Plus className="size-4" />
        Add New Lead
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-xl rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-border">
              <h2 className="text-xl font-semibold">Add New Lead</h2>
              <button type="button" onClick={() => setOpen(false)} className="p-2 hover:bg-muted rounded-full">
                <X className="size-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <input required name="name" placeholder="e.g. John Doe" className="w-full px-3 py-2 bg-muted rounded-lg border-transparent focus:border-blue-600 focus:bg-background outline-none transition-all text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Business / Dealer Name</label>
                  <input name="business_name" placeholder="e.g. Doe Motors" className="w-full px-3 py-2 bg-muted rounded-lg border-transparent focus:border-blue-600 focus:bg-background outline-none transition-all text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <input type="email" name="email" placeholder="e.g. john@example.com" className="w-full px-3 py-2 bg-muted rounded-lg border-transparent focus:border-blue-600 focus:bg-background outline-none transition-all text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone</label>
                  <input name="phone" placeholder="e.g. +91 98765 43210" className="w-full px-3 py-2 bg-muted rounded-lg border-transparent focus:border-blue-600 focus:bg-background outline-none transition-all text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Source</label>
                  <select name="source" className="w-full px-3 py-2 bg-muted rounded-lg border-transparent focus:border-blue-600 focus:bg-background outline-none transition-all text-sm">
                    <option value="website">Website</option>
                    <option value="facebook">Facebook</option>
                    <option value="google">Google</option>
                    <option value="offline">Offline</option>
                    <option value="referral">Referral</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Priority</label>
                  <select name="priority" className="w-full px-3 py-2 bg-muted rounded-lg border-transparent focus:border-blue-600 focus:bg-background outline-none transition-all text-sm" defaultValue="medium">
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Intent Status (Health)</label>
                  <select name="health" className="w-full px-3 py-2 bg-muted rounded-lg border-transparent focus:border-blue-600 focus:bg-background outline-none transition-all text-sm" defaultValue="warm">
                    <option value="hot">🔥 Hot</option>
                    <option value="warm">⚡ Warm</option>
                    <option value="cold">❄️ Cold</option>
                    <option value="stalled">⏳ Stalled</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">AI Score</label>
                  <input type="number" min="0" max="100" name="score" defaultValue="50" className="w-full px-3 py-2 bg-muted rounded-lg border-transparent focus:border-blue-600 focus:bg-background outline-none transition-all text-sm" />
                </div>

                {/* Car Interest Section */}
                <div className="space-y-2 col-span-2">
                  <label className="text-sm font-medium">Interested In (Vehicle)</label>
                  <select name="vehicle" className="w-full px-3 py-2 bg-muted rounded-lg border-transparent focus:border-blue-600 focus:bg-background outline-none transition-all text-sm" defaultValue="Hyundai i20 Asta">
                    <option value="Hyundai i20 Asta">Hyundai i20 Asta</option>
                    <option value="Hyundai Creta SX (O)">Hyundai Creta SX (O)</option>
                    <option value="Hyundai Venue N-Line">Hyundai Venue N-Line</option>
                    <option value="Hyundai Tucson Platinum">Hyundai Tucson Platinum</option>
                    <option value="Hyundai Aura SX CNG">Hyundai Aura SX CNG</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Budget</label>
                  <select name="budget" className="w-full px-3 py-2 bg-muted rounded-lg border-transparent focus:border-blue-600 focus:bg-background outline-none transition-all text-sm" defaultValue="₹8L - ₹11L">
                    <option value="₹8L - ₹11L">₹8L - ₹11L</option>
                    <option value="₹11L - ₹14L">₹11L - ₹14L</option>
                    <option value="₹14L - ₹18L">₹14L - ₹18L</option>
                    <option value="₹18L - ₹25L">₹18L - ₹25L</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Fuel Type</label>
                  <select name="fuel" className="w-full px-3 py-2 bg-muted rounded-lg border-transparent focus:border-blue-600 focus:bg-background outline-none transition-all text-sm" defaultValue="Petrol">
                    <option value="Petrol">Petrol</option>
                    <option value="Diesel">Diesel</option>
                    <option value="CNG">CNG</option>
                    <option value="Electric">Electric</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Financing Needs</label>
                  <select name="financing" className="w-full px-3 py-2 bg-muted rounded-lg border-transparent focus:border-blue-600 focus:bg-background outline-none transition-all text-sm" defaultValue="Needs Assistance">
                    <option value="Needs Assistance">Needs Assistance</option>
                    <option value="Pre-approved">Pre-approved</option>
                    <option value="Self Funded">Self Funded</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Location</label>
                  <input name="location" defaultValue="Bengaluru, KA" className="w-full px-3 py-2 bg-muted rounded-lg border-transparent focus:border-blue-600 focus:bg-background outline-none transition-all text-sm" />
                </div>

                {/* Assignment Controls */}
                <div className="space-y-2 col-span-2">
                  <label className="text-sm font-medium">Assign Representative</label>
                  {role === 'sales' ? (
                    <div>
                      <input type="hidden" name="assigned_to" value="22222222-2222-2222-2222-222222222222" />
                      <div className="w-full px-3 py-2 bg-slate-100 dark:bg-muted/50 rounded-lg text-slate-500 font-semibold border border-slate-200 dark:border-border text-sm">
                        Michael Chen (Assigned to Self)
                      </div>
                    </div>
                  ) : (
                    <select name="assigned_to" className="w-full px-3 py-2 bg-muted rounded-lg border-transparent focus:border-blue-600 focus:bg-background outline-none transition-all text-sm" defaultValue="22222222-2222-2222-2222-222222222222">
                      <option value="11111111-1111-1111-1111-111111111111">Sarah Jenkins (Sr. Sales Advisor)</option>
                      <option value="22222222-2222-2222-2222-222222222222">Michael Chen (Sales Rep)</option>
                      <option value="33333333-3333-3333-3333-333333333333">David Kumar (Sales Rep)</option>
                      <option value="44444444-4444-4444-4444-444444444444">Priya Sharma (Jr. Sales)</option>
                      <option value="55555555-5555-5555-5555-555555555555">Alex Thompson (BDR)</option>
                      <option value="">Unassigned / Auto-route</option>
                    </select>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <textarea name="notes" placeholder="Any additional background info..." rows={3} className="w-full px-3 py-2 bg-muted rounded-lg border-transparent focus:border-blue-600 focus:bg-background outline-none transition-all text-sm" />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 font-medium hover:bg-muted rounded-xl transition-colors">
                  Cancel
                </button>
                <button disabled={loading} type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-semibold transition-colors disabled:opacity-50">
                  {loading ? "Saving..." : "Save Lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
