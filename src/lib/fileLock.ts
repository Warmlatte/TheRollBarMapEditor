type LockMessage = { type: 'lock' | 'unlock'; fileId: string; tabId: string }

export type FileLock = {
  isLockedByOtherTab(fileId: string): boolean
  broadcastLock(fileId: string): void
  broadcastUnlock(fileId: string): void
}

export function createFileLock(tabId: string): FileLock {
  const channel = new BroadcastChannel('hexmap.fileLock.v1')
  const remoteLockedIds = new Set<string>()

  channel.addEventListener('message', (event: MessageEvent<LockMessage>) => {
    const { type, fileId, tabId: senderTabId } = event.data
    if (senderTabId === tabId) return // ignore own broadcasts
    if (type === 'lock') {
      remoteLockedIds.add(fileId)
    } else if (type === 'unlock') {
      remoteLockedIds.delete(fileId)
    }
  })

  function isLockedByOtherTab(fileId: string): boolean {
    return remoteLockedIds.has(fileId)
  }

  function broadcastLock(fileId: string): void {
    channel.postMessage({ type: 'lock', fileId, tabId })
  }

  function broadcastUnlock(fileId: string): void {
    channel.postMessage({ type: 'unlock', fileId, tabId })
  }

  return { isLockedByOtherTab, broadcastLock, broadcastUnlock }
}

// Singleton instance for the app (tabId is stable per page load)
export const fileLock = createFileLock(crypto.randomUUID())
