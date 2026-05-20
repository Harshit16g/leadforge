"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { PageHeader } from "@/components/common/PageHeader";

export default function QRGenerationPage() {
  const [source, setSource] = useState("offline");
  
  // Create a URL pointing to our local or production capture page
  // We use window.location.origin to get the current host safely in the browser.
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const captureUrl = `${baseUrl}/capture?source=${source}`;

  return (
    <div className="flex-1 h-full w-full overflow-y-auto pr-2 space-y-6 pb-12 max-w-[1440px] mx-auto scrollbar-thin">
      <PageHeader 
        title="QR Lead Capture" 
        subtitle="Generate a QR code for offline events, billboards, or walk-ins. Customers scan this code to submit their details directly into the CRM."
      />
      
      <div className="grid md:grid-cols-2 gap-8">
        {/* Settings */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-6">
          <h2 className="text-lg font-semibold tracking-tight">QR Settings</h2>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Lead Source</label>
              <select 
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="offline">Offline Event / Walk-in</option>
                <option value="facebook">Facebook Campaign</option>
                <option value="google">Google Campaign</option>
                <option value="referral">Referral / Partner</option>
              </select>
              <p className="text-xs text-muted-foreground">Leads generated via this QR code will automatically be tagged with this source.</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Capture URL</label>
              <input 
                readOnly
                value={captureUrl}
                className="w-full h-10 px-3 rounded-md border border-input bg-muted text-sm text-muted-foreground"
              />
            </div>
          </div>
        </div>

        {/* QR Code Display */}
        <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center justify-center space-y-6">
          <div className="bg-white p-4 rounded-xl border shadow-sm">
            <QRCodeSVG value={captureUrl} size={250} level="H" includeMargin />
          </div>
          <div className="text-center space-y-1">
            <p className="font-semibold text-card-foreground">Scan to Test!</p>
            <p className="text-sm text-muted-foreground">Point your phone camera here to see the customer experience.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
