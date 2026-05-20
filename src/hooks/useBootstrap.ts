"use client"
import { useState, useEffect, useRef } from 'react'
import { runBootstrap, BootstrapStage } from '@/lib/bootstrap'
import { useBeacon } from '@/components/providers/BeaconProvider'

export function useBootstrap() {
  const [stage, setStage] = useState<BootstrapStage>('idle')
  const [isReady, setIsReady] = useState(false)
  const beacon = useBeacon()

  console.log('[BOOTSTRAP] Hook mounted');

  const hasStarted = useRef(false);

  useEffect(() => {
    // skip if already started or on soft navigation
    if (hasStarted.current || sessionStorage.getItem('leaex_bootstrapped')) {
      if (sessionStorage.getItem('leaex_bootstrapped')) {
        console.log('[BOOTSTRAP] Skipping cold start (soft navigation)');
        setIsReady(true)
        setStage('ready')
      }
      return
    }

    hasStarted.current = true;
    console.log('[BOOTSTRAP] Initializing cold start sequence');
    runBootstrap(setStage, {
      getSession: () => (beacon as any).validateSession(),
      getOrg: () => (beacon as any).resolveOrg(),
      getPerms: () => (beacon as any).loadPermissions(),
    }).then(() => {
      console.log('[BOOTSTRAP] Sequence completed, mounting dashboard');
      sessionStorage.setItem('leaex_bootstrapped', '1')
      setIsReady(true)
    })
  }, [beacon])

  return { stage, isReady }
}
