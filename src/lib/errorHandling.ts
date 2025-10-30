// Registers global error and unhandledrejection handlers to filter noisy errors
// and to provide clearer diagnostics for AVIF/WASM-related issues.
export function registerGlobalErrorHandlers(): void {
  // 'error' events (synchronous/runtime errors)
  window.addEventListener('error', (event) => {
    // Ignore common extension/runtime noise
    if (
      event.message?.includes('runtime.lastError') ||
      event.message?.includes('extension port') ||
      event.message?.includes('back/forward cache')
    ) {
      return
    }

    // Ignore unrelated devtool noise (MobX State Tree etc.)
    if (
      event.message?.includes('mobx-state-tree') ||
      event.message?.includes('RecordingMachineModel') ||
      event.message?.includes('no longer part of a state tree')
    ) {
      return
    }

    // Highlight AVIF/worker related errors in logs for easier triage
    if (
      event.message?.toLowerCase().includes('avif') ||
      event.filename?.toLowerCase().includes('avif') ||
      event.filename?.toLowerCase().includes('worker')
    ) {
      console.error('AVIF処理エラー:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
      })
    }
  })

  // 'unhandledrejection' events (async/promise errors)
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason
    const reasonString = String(reason)
    const reasonMessage = reason?.message || reasonString

    // Ignore extension noise
    if (
      reasonMessage.includes('runtime.lastError') ||
      reasonMessage.includes('extension port') ||
      reasonMessage.includes('back/forward cache')
    ) {
      event.preventDefault()
      return
    }

    // Ignore unrelated devtool noise
    if (
      reasonMessage.includes('mobx-state-tree') ||
      reasonMessage.includes('RecordingMachineModel') ||
      reasonMessage.includes('no longer part of a state tree')
    ) {
      event.preventDefault()
      return
    }

    // Surface AVIF-related promise rejections
    if (
      reasonMessage.toLowerCase().includes('avif') ||
      reasonString.toLowerCase().includes('avif')
    ) {
      console.error('AVIF処理Promise拒否:', event.reason)
    }
  })
}


