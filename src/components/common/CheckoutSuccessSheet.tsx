"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

interface CheckoutSuccessSheetProps {
  invoice: { id: string; final_amount: number } | null;
  customerPhone: string;
  onClose: () => void;
}

export function CheckoutSuccessSheet({ invoice, customerPhone, onClose }: CheckoutSuccessSheetProps) {
  const [sharing, setSharing] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  if (!invoice) return null;

  async function handlePrint() {
    if (printing) return;
    setPrinting(true);
    try {
      const res = await fetch(`/api/partner/walkin/invoice/${invoice?.id}/pdf`);
      if (!res.ok) throw new Error("Failed to generate PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const win = window.open(url, "_blank");
      if (win) {
        win.onload = () => setTimeout(() => win.print(), 500);
      } else {
        const a = document.createElement("a");
        a.href = url;
        a.download = `invoice-${invoice?.id.slice(0, 8)}.pdf`;
        a.click();
      }
    } catch (err) {
      toast.error("Print failed. Please try again.");
    } finally {
      setPrinting(false);
    }
  }

  async function handleShare() {
    if (sharing) return;
    setSharing(true);
    try {
      const res = await fetch(`/api/partner/walkin/invoice/${invoice?.id}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: customerPhone }),
      });
      if (!res.ok) throw new Error("Share failed");
      setShareSuccess(true);
      toast.success("Invoice shared via WhatsApp!");
    } catch (err) {
      toast.error("Failed to share invoice.");
    } finally {
      setSharing(false);
    }
  }

  return (
    <Sheet open={!!invoice} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="sm:max-w-[500px] p-0 border-l border-border bg-card overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Success Hero */}
          <div className="bg-emerald-500/5 p-12 text-center relative overflow-hidden shrink-0 border-b border-emerald-500/10">
             <div className="absolute top-0 right-0 p-8 opacity-5"><span className="icon-[solar--check-circle-bold-duotone] size-32" /></div>
             <div className="w-20 h-20 rounded-3xl bg-emerald-500 text-white flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/20 animate-in zoom-in-50 duration-500">
                <span className="icon-[solar--check-circle-bold-duotone] size-10" />
             </div>
             <SheetTitle className="text-3xl font-black text-foreground tracking-tight">Checkout Complete</SheetTitle>
             <SheetDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 mt-2">
                Transaction finalized successfully
             </SheetDescription>
          </div>

          <div className="flex-1 overflow-y-auto p-10 space-y-10">
             {/* Transaction Summary */}
             <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Financial Summary</p>
                <div className="bg-muted/30 rounded-3xl p-8 border border-border flex flex-col items-center justify-center gap-2">
                   <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Grand Total</p>
                   <p className="text-5xl font-black text-foreground tabular-nums tracking-tighter">
                      ₹{invoice.final_amount.toLocaleString("en-IN")}
                   </p>
                   <div className="mt-4 px-4 py-1.5 rounded-full bg-background border border-border text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground">
                      Ref: INV-{invoice.id.slice(-8).toUpperCase()}
                   </div>
                </div>
             </div>

             {/* Distribution Options */}
             <div className="space-y-6">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Post-Checkout Actions</p>
                
                <div className="grid grid-cols-1 gap-4">
                   <Button 
                      onClick={handleShare} 
                      disabled={sharing || shareSuccess}
                      className={cn(
                        "h-16 rounded-2xl flex items-center justify-between px-8 transition-all group",
                        shareSuccess ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" : "bg-primary text-white shadow-xl shadow-primary/20"
                      )}
                   >
                      <div className="flex items-center gap-4">
                         <span className={cn(shareSuccess ? "icon-[solar--check-circle-bold-duotone]" : "icon-[solar--plain-2-bold-duotone]", "size-6")} />
                         <div className="text-left">
                            <p className="text-sm font-black uppercase tracking-widest leading-none mb-1">
                               {shareSuccess ? "Shared Successfully" : "WhatsApp Invoice"}
                            </p>
                            <p className="text-[9px] font-bold opacity-70 uppercase tracking-tighter">
                               {shareSuccess ? "Client notified on mobile" : `Send to ${customerPhone}`}
                            </p>
                         </div>
                      </div>
                      {!shareSuccess && <span className="icon-[solar--alt-arrow-right-linear] size-4 group-hover:translate-x-1 transition-transform" />}
                   </Button>

                   <Button 
                      variant="outline" 
                      onClick={handlePrint}
                      disabled={printing}
                      className="h-16 rounded-2xl border-border bg-card hover:bg-muted flex items-center justify-between px-8 group transition-all"
                   >
                      <div className="flex items-center gap-4">
                         <span className={cn(printing ? "icon-[solar--refresh-linear] animate-spin" : "icon-[solar--printer-bold-duotone]", "size-6 text-muted-foreground")} />
                         <div className="text-left">
                            <p className="text-sm font-black uppercase tracking-widest leading-none mb-1">Print Physical Receipt</p>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">Thermal or A4 format</p>
                         </div>
                      </div>
                      <span className="icon-[solar--alt-arrow-right-linear] size-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                   </Button>
                </div>
             </div>

             {/* Loyalty Info */}
             <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                   <span className="icon-[solar--star-bold-duotone] size-5" />
                </div>
                <div>
                   <p className="text-xs font-black uppercase tracking-widest text-primary mb-1">Loyalty Points Added</p>
                   <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                      Client will receive points for this visit based on the bill value.
                   </p>
                </div>
             </div>
          </div>

          {/* Footer */}
          <div className="p-8 border-t border-border bg-muted/20 shrink-0">
             <Button onClick={onClose} className="w-full h-12 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] border border-border bg-background hover:bg-muted text-foreground transition-all">
                Dismiss and Continue
             </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
