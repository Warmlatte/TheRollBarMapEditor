import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'

// Mock BroadcastChannel before importing fileLock
const mockPostMessage = vi.fn()
let messageHandler: ((event: MessageEvent) => void) | null = null

class MockBroadcastChannel {
  name: string
  onmessage: ((event: MessageEvent) => void) | null = null

  constructor(name: string) {
    this.name = name
    messageHandler = null
  }

  postMessage(data: unknown) {
    mockPostMessage(data)
  }

  addEventListener(type: string, handler: (event: MessageEvent) => void) {
    if (type === 'message') {
      messageHandler = handler
    }
  }

  close() {}
}

vi.stubGlobal('BroadcastChannel', MockBroadcastChannel)

// Import after mock is set up
const { createFileLock } = await import('../fileLock')

function sendRemoteMessage(data: unknown, tabId?: string) {
  if (messageHandler) {
    messageHandler({ data } as MessageEvent)
  }
}

describe('fileLock - remote lock tracking', () => {
  let lock: ReturnType<typeof createFileLock>

  beforeEach(() => {
    mockPostMessage.mockClear()
    messageHandler = null
    lock = createFileLock('own-tab-id')
  })

  it('isLockedByOtherTab returns false initially', () => {
    expect(lock.isLockedByOtherTab('map.trbm')).toBe(false)
  })

  it('remote lock message adds fileId to set', () => {
    sendRemoteMessage({ type: 'lock', fileId: 'map.trbm', tabId: 'other-tab' })
    expect(lock.isLockedByOtherTab('map.trbm')).toBe(true)
  })

  it('remote unlock message removes fileId from set', () => {
    sendRemoteMessage({ type: 'lock', fileId: 'map.trbm', tabId: 'other-tab' })
    sendRemoteMessage({ type: 'unlock', fileId: 'map.trbm', tabId: 'other-tab' })
    expect(lock.isLockedByOtherTab('map.trbm')).toBe(false)
  })

  it('own tabId lock broadcast is ignored', () => {
    sendRemoteMessage({ type: 'lock', fileId: 'map.trbm', tabId: 'own-tab-id' })
    expect(lock.isLockedByOtherTab('map.trbm')).toBe(false)
  })
})

describe('fileLock - broadcastLock / broadcastUnlock', () => {
  let lock: ReturnType<typeof createFileLock>

  beforeEach(() => {
    mockPostMessage.mockClear()
    messageHandler = null
    lock = createFileLock('own-tab-id')
  })

  it('broadcastLock posts correct message', () => {
    lock.broadcastLock('map.trbm')
    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'lock', fileId: 'map.trbm' }),
    )
  })

  it('broadcastUnlock posts correct message', () => {
    lock.broadcastUnlock('map.trbm')
    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'unlock', fileId: 'map.trbm' }),
    )
  })
})
