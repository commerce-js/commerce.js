// ---------------------------------------------------------------------------
// useDeployStream — composable for real-time deploy status via SSE
// ---------------------------------------------------------------------------
// Connects to the deploy-stream SSE endpoint and provides reactive state.
//
// Usage:
//   const { status, deployment, isStreaming, connect, close } = useDeployStream(projectId)
//   connect(deploymentId)  // start streaming
// ---------------------------------------------------------------------------

interface DeployStatusEvent {
  id: string
  status: 'building' | 'deploying' | 'ready' | 'failed'
  url?: string
  error?: string
  buildDurationMs?: number
}

export function useDeployStream(projectId: string) {
  const deployment = ref<DeployStatusEvent | null>(null)
  const status = computed(() => deployment.value?.status ?? null)
  const isStreaming = ref(false)
  let eventSource: EventSource | null = null

  function connect(deploymentId?: string) {
    close() // clean up any previous connection

    const params = new URLSearchParams()
    if (deploymentId) params.set('deploymentId', deploymentId)

    const url = `/api/projects/${projectId}/deploy-stream?${params.toString()}`
    eventSource = new EventSource(url)
    isStreaming.value = true

    eventSource.addEventListener('status', ((e: Event) => {
      try {
        deployment.value = JSON.parse((e as MessageEvent).data)
      }
      catch {
        console.error('[useDeployStream] Failed to parse status event')
      }
    }) as EventListener)

    eventSource.addEventListener('done', () => {
      isStreaming.value = false
      eventSource?.close()
      eventSource = null
    })

    eventSource.onerror = () => {
      // EventSource auto-reconnects on network errors.
      // If permanently closed (server sent done), this won't fire.
      console.warn('[useDeployStream] Connection error, will auto-reconnect')
    }
  }

  function close() {
    if (eventSource) {
      eventSource.close()
      eventSource = null
    }
    isStreaming.value = false
  }

  // Cleanup on unmount
  onUnmounted(close)

  return {
    /** Current deployment status data */
    deployment: readonly(deployment),
    /** Current status string (shortcut) */
    status,
    /** Whether the SSE connection is active */
    isStreaming: readonly(isStreaming),
    /** Open SSE connection for a deployment */
    connect,
    /** Close the SSE connection */
    close,
  }
}
