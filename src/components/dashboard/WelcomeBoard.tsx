"use client"
import { cn } from "@/lib/utils"

export function WelcomeBoard({
  name,
  business,
  location,
  target = 0,
  rating = 0,
  bookings = 0,
}: {
  name: string
  business: string
  location: string
  target?: number
  rating?: number
  bookings?: number
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 w-full text-white shadow-[0_20px_40px_-15px_rgba(91,141,239,0.35)] dark:shadow-none">
      <div className="absolute inset-0 bg-gradient-to-r from-[#5B8DEF] via-[#4AAFE8] to-[#2EC4B6] dark:opacity-40" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(255,255,255,0.15),transparent_50%)]" />

      <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[10px] font-bold uppercase tracking-widest mb-4">
            OVERVIEW
          </span>
          <h1 className="text-3xl md:text-4xl font-bold leading-tight">
            Welcome back, {name}! 👋
          </h1>
          <p className="text-sm text-white/80 mt-1.5 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            {business} · Premium Hyundai Dealership · {location || "Your Dealership"}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {[
            { label: 'TARGET', value: `${target}%` },
            { label: 'RATING', value: rating > 0 ? `${rating}★` : '—' },
            { label: 'THIS MONTH', value: `${bookings} bookings` },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/12 backdrop-blur-xl rounded-2xl px-5 py-3 border border-white/20 min-w-[110px]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">{stat.label}</p>
              <p className="text-xl font-bold mt-0.5">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
