"use client";

import { useEffect, useState } from "react";
import { Sparkles, Megaphone, UserPlus, PhoneCall, AlertTriangle, ArrowRightLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type FeedItem = {
  id: string;
  type: 'ai' | 'marketing' | 'lead' | 'action' | 'alert' | 'system';
  message: string;
  time: string;
};

// Initial simulated feed
const INITIAL_FEED: FeedItem[] = [
  { id: '1', type: 'alert', message: 'SLA Escalation: Rohit Khanna untouched for 2h', time: 'Just now' },
  { id: '2', type: 'lead', message: 'New lead from Google Ads: Suresh Reddy', time: '5m ago' },
  { id: '3', type: 'ai', message: 'Duplicate merged: Ananya Desai', time: '12m ago' },
  { id: '4', type: 'action', message: 'Priya changed status of Arjun Mehta to Contacted', time: '18m ago' },
];

export function ActivityFeed() {
  const [feed, setFeed] = useState<FeedItem[]>(INITIAL_FEED);

  useEffect(() => {
    // Simulate real-time operational updates every 15-30 seconds
    const interval = setInterval(() => {
      const newEvents: FeedItem[] = [
        { id: Date.now().toString(), type: 'action', message: 'Lead assigned to Michael Chen', time: 'Just now' },
        { id: Date.now().toString(), type: 'lead', message: 'Test drive scheduled for Hyundai Creta', time: 'Just now' },
        { id: Date.now().toString(), type: 'ai', message: 'AI scored incoming walk-in as Hot', time: 'Just now' },
        { id: Date.now().toString(), type: 'system', message: 'Pipeline status updated via Drag & Drop', time: 'Just now' }
      ];
      
      const randomEvent = newEvents[Math.floor(Math.random() * newEvents.length)];
      
      setFeed(prev => {
        const updated = [randomEvent, ...prev].slice(0, 8); // Keep last 8
        // Age the times slightly
        return updated.map((item, idx) => ({
          ...item,
          time: idx === 0 ? 'Just now' : idx === 1 ? '1m ago' : idx === 2 ? '5m ago' : item.time
        }));
      });
    }, 25000);

    return () => clearInterval(interval);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'ai': return <Sparkles className="size-3 text-blue-500" />;
      case 'marketing': return <Megaphone className="size-3 text-emerald-500" />;
      case 'lead': return <UserPlus className="size-3 text-purple-500" />;
      case 'action': return <PhoneCall className="size-3 text-indigo-500" />;
      case 'alert': return <AlertTriangle className="size-3 text-rose-500" />;
      default: return <ArrowRightLeft className="size-3 text-slate-500" />;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3 pb-8">
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-1">Live Activity</h3>
      {feed.map(item => (
        <div key={item.id} className="flex gap-2.5 items-start group">
          <div className="mt-0.5 bg-slate-800 p-1.5 rounded-md shrink-0 border border-slate-700 shadow-sm">
            {getIcon(item.type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] text-slate-300 leading-snug font-medium line-clamp-2 group-hover:text-white transition-colors">{item.message}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{item.time}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
