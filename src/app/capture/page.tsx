"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createLead } from "@/app/actions/leads";

function CaptureForm() {
  const searchParams = useSearchParams();
  const defaultSource = searchParams.get("source") || "website";
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    try {
      await createLead(formData);
      setIsSuccess(true);
    } catch (err) {
      console.error(err);
      alert("Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSuccess) {
    return (
      <div className="text-center space-y-4 py-12">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="icon-[solar--check-circle-bold] text-3xl" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Thank You!</h2>
        <p className="text-muted-foreground">Your interest has been recorded. Our team will contact you shortly.</p>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium">Full Name</label>
        <input 
          required 
          name="name" 
          placeholder="Jane Doe"
          className="w-full h-11 px-3 rounded-md border border-input bg-background text-sm"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Email Address</label>
          <input 
            type="email" 
            name="email" 
            placeholder="jane@example.com"
            className="w-full h-11 px-3 rounded-md border border-input bg-background text-sm"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Phone Number</label>
          <input 
            required 
            type="tel" 
            name="phone" 
            placeholder="+1 (555) 000-0000"
            className="w-full h-11 px-3 rounded-md border border-input bg-background text-sm"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Company (Optional)</label>
        <input 
          name="business_name" 
          placeholder="Acme Corp"
          className="w-full h-11 px-3 rounded-md border border-input bg-background text-sm"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">What are you interested in?</label>
        <textarea 
          name="notes" 
          rows={3}
          placeholder="E.g., I'm looking for a 5-seater SUV..."
          className="w-full p-3 rounded-md border border-input bg-background text-sm resize-none"
        />
      </div>

      {/* Hidden Fields for the CRM */}
      <input type="hidden" name="source" value={defaultSource} />
      <input type="hidden" name="status" value="new" />
      <input type="hidden" name="health" value="warm" />

      <button 
        type="submit" 
        disabled={isSubmitting}
        className="w-full h-12 bg-primary text-primary-foreground font-semibold rounded-md flex items-center justify-center hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {isSubmitting ? "Submitting..." : "Submit Inquiry"}
      </button>
    </form>
  );
}

export default function CapturePage() {
  return (
    <div className="min-h-screen bg-muted/30 py-12 px-4 flex items-center justify-center">
      <div className="w-full max-w-xl bg-card border border-border shadow-xl rounded-2xl overflow-hidden">
        <div className="bg-primary p-8 text-center text-primary-foreground">
          <h1 className="text-3xl font-bold tracking-tight">HSR Motors</h1>
          <p className="opacity-90 mt-2">Find your perfect drive today.</p>
        </div>
        <div className="p-8">
          <Suspense fallback={<div className="text-center py-10">Loading form...</div>}>
            <CaptureForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
