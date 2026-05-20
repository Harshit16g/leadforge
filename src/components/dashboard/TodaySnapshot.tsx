"use client"

import React from "react"
import { Users, Clock, AlertCircle } from "lucide-react"

interface TodaySnapshotProps {
  staffOnDuty: number
  noShows: number
  avgWaitTime: string
}

export function TodaySnapshot({ staffOnDuty, noShows, avgWaitTime }: TodaySnapshotProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users className="size-4 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Staff On Duty</span>
            <span className="text-sm font-bold">{staffOnDuty} Members</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="size-4 text-destructive" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">No-Shows</span>
            <span className="text-sm font-bold text-destructive">{noShows} Bookings</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Clock className="size-4 text-amber-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Avg Wait Time</span>
            <span className="text-sm font-bold">{avgWaitTime}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
