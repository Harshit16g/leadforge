export type BootstrapStage = 'idle' | 'session' | 'org' | 'permissions' | 'ready'

export async function runBootstrap(
  onStage: (s: BootstrapStage) => void,
  context: { getSession: () => Promise<any>, getOrg: () => Promise<any>, getPerms: () => Promise<any> }
) {
  const start = Date.now()
  const MIN_MS = 0 // Removed artificial delay — let the UI handle transitions

  console.log('[BOOTSTRAP] Execution started');
  console.time('[BOOTSTRAP] Total Latency');

  try {
    console.time('[BOOTSTRAP] Stage: Session');
    onStage('session')
    await context.getSession()
    console.timeEnd('[BOOTSTRAP] Stage: Session');

    console.time('[BOOTSTRAP] Stage: Org');
    onStage('org')
    await context.getOrg()
    console.timeEnd('[BOOTSTRAP] Stage: Org');

    console.time('[BOOTSTRAP] Stage: Permissions');
    onStage('permissions')
    await context.getPerms()
    console.timeEnd('[BOOTSTRAP] Stage: Permissions');

    // ensure minimum time for perception
    const elapsed = Date.now() - start
    if (elapsed < MIN_MS) {
      await new Promise(r => setTimeout(r, MIN_MS - elapsed))
    }

    onStage('ready')
    console.timeEnd('[BOOTSTRAP] Total Latency');
    console.log(`[BOOTSTRAP] Ready after ${Date.now() - start}ms`);

    // non-blocking
    setTimeout(() => {
      // initializeRealtime()
      // preloadDashboard()
    }, 0)

  } catch (e) {
    console.error('[BOOTSTRAP_FAILED]', e)
    onStage('ready') // fail open to login
  }
}
