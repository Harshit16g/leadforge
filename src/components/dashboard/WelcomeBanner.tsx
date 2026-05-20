"use client"

import React from "react"
import { MapPin } from "lucide-react"
import { cn } from "@/lib/utils"
import { DotLottiePlayer } from "@dotlottie/react-player"
import { motion, AnimatePresence } from "framer-motion"
import { useDashboardFilters } from "@/contexts/DashboardFilters"

interface WelcomeBannerProps {
  name: string
  business: string
  category?: string
  location: string
  target?: number | null
  rating?: number | null
  sessions?: number
  isCompact?: boolean
}

export function WelcomeBanner({
  name,
  business,
  category = "Premium Hyundai Dealership",
  location,
  target = null,
  rating = null,
  sessions = 0,
  isCompact = false,
}: WelcomeBannerProps) {
  const firstName = name.split(" ")[0]
  const { isWelcomeExpanded } = useDashboardFilters()

  if (isCompact) {
    return (
      <div className="relative w-full h-[72px] flex items-center justify-between px-6 lg:px-8 rounded-[16px] overflow-hidden group shadow-md"
        style={{ background: "linear-gradient(90deg, #4F6CFF 0%, #3AA8F2 45%, #1DB9A0 100%)" }}>
        {/* Dark Mode Overlay */}
        <div className="absolute inset-0 bg-black/10 dark:bg-black/40 opacity-0 dark:opacity-100 transition-opacity" />

        <div className="relative z-10 flex items-center gap-4">
          <span className="px-3 py-1 rounded-full bg-white/18 backdrop-blur-sm text-[10px] font-bold text-white/90 uppercase tracking-[1px]">
            OVERVIEW
          </span>
          <div className="flex items-center gap-2">
            <h1 className="text-lg lg:text-xl font-bold text-white">
              Welcome back, {firstName}!
            </h1>
            <div className="w-12 h-12 flex-shrink-0 select-none -my-2">
              <DotLottiePlayer
                src="/animations/welcome.lottie"
                autoplay
                loop
              />
            </div>
          </div>
          <div className="hidden md:flex items-center gap-1.5 text-white/80 text-xs font-medium">
            <MapPin className="h-3 w-3" />
            <span>{business} · {location}</span>
          </div>
        </div>

        <div className="relative z-10 hidden sm:flex items-center gap-6">
          <div className="flex flex-col items-end">
            <p className="text-[10px] font-bold text-white/70 uppercase">Active Leads</p>
            <p className="text-sm font-bold text-white">{sessions}</p>
          </div>
          <div className="flex flex-col items-end">
            <p className="text-[10px] font-bold text-white/70 uppercase">Closing Rate</p>
            <p className="text-sm font-bold text-white">{rating !== null && rating !== undefined ? `${rating * 5}%` : "—"}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <AnimatePresence>
      {isWelcomeExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ type: "spring", bounce: 0.3, duration: 0.8 }}
          className="overflow-hidden w-full"
        >
          <div className="relative w-full min-h-[220px] lg:h-[260px] flex flex-col lg:flex-row lg:items-center justify-between px-6 py-8 lg:px-12 lg:py-9 rounded-[24px] overflow-hidden group shadow-lg shadow-primary/10"
            style={{
              background: "linear-gradient(90deg, #4F6CFF 0%, #3AA8F2 45%, #1DB9A0 100%)"
            }}>

            {/* Dark Mode Overlay */}
            <div className="absolute inset-0 bg-black/10 dark:bg-black/40 opacity-0 dark:opacity-100 transition-opacity" />

            {/* Left Content */}
            <div className="relative z-10 flex flex-col items-start">
              <span className="px-4 py-1.5 rounded-full bg-white/18 backdrop-blur-sm text-[12px] font-semibold text-white/90 uppercase tracking-[1.2px] mb-5">
                OVERVIEW
              </span>

              <div className="flex items-center gap-3">
                <h1 className="text-[28px] lg:text-[40px] font-bold text-white leading-tight">
                  Welcome back, {firstName}!
                </h1>
                <div className="w-24 h-24 lg:w-32 lg:h-32 flex-shrink-0 select-none -my-6 lg:-my-8">
                  <DotLottiePlayer
                    src="/animations/welcome.lottie"
                    autoplay
                    loop
                  />
                </div>
              </div>

              <div className="flex items-center gap-1.5 mt-3 text-white/85 text-[14px] lg:text-[16px] font-normal">
                <MapPin className="h-4 w-4 text-white/80" />
                <span>{business} · {category} · {location}</span>
              </div>
            </div>

            {/* Right Stats */}
            <div className="relative z-10 flex flex-row flex-wrap gap-4 mt-8 lg:mt-0">
              <StatCard label="TARGET" value={target !== null && target !== undefined ? `${target}%` : "—"} />
              <StatCard label="ACTIVE LEADS" value={`${sessions}`} suffix="leads" />
              <StatCard label="CLOSING RATE" value={rating !== null && rating !== undefined ? `${rating * 5}%` : "—"} />
              <StatCard label="SLA RESPONSE" value="12m" suffix="avg" />
            </div>

            {/* Subtle Mesh/Glow for extra polish */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function StatCard({ label, value, suffix }: { label: string; value: string; suffix?: string }) {
  return (
    <div className="w-[140px] h-[92px] bg-white/12 backdrop-blur-[12px] border border-white/20 rounded-[18px] px-4 py-3.5 flex flex-col justify-center transition-all duration-300 hover:scale-[1.04] shadow-[inset_0_0_12px_rgba(255,255,255,0.06),0_8px_16px_rgba(0,0,0,0.04)]">
      <p className="text-[12px] font-medium text-white/75 uppercase tracking-tight">{label}</p>
      <div className="mt-1.5 flex items-baseline gap-1.5">
        <p className="text-[26px] font-bold text-white leading-none">{value}</p>
        {suffix && <p className="text-[18px] font-medium text-white leading-none">{suffix}</p>}
      </div>
    </div>
  )
}
