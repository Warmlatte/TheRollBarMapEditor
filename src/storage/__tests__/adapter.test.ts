import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { MapData, MapFile } from '@/data/types'
import { getStorageAdapter, WebFsaAdapter, WebFallbackAdapter } from '@/storage/adapter'

const VALID_MAP_FILE: MapFile = {
  version: 1,
  name: 'Test Map',
  bounds: { radius: 5 },
  hexes: [],
  icons: [],
  lines: [],
  doodles: [],
}

const VALID_MAP_DATA: MapData = {
  name: 'Test Map',
  bounds: { radius: 5 },
  hexes: [],
  icons: [],
  lines: [],
  doodles: [],
}

// ── Task 1.1 & 1.2: StorageAdapter interface & getStorageAdapter factory ──

describe('getStorageAdapter', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns WebFsaAdapter when showOpenFilePicker is available', () => {
    vi.stubGlobal('showOpenFilePicker', vi.fn())
    expect(getStorageAdapter()).toBeInstanceOf(WebFsaAdapter)
  })

  it('returns WebFallbackAdapter when showOpenFilePicker is not available', () => {
    // happy-dom does not implement showOpenFilePicker — fallback is selected by default
    expect(getStorageAdapter()).toBeInstanceOf(WebFallbackAdapter)
  })
})

// ── Task 2.1: WebFsaAdapter.openMap — three-stage validation gate ──

describe('WebFsaAdapter.openMap', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function makeFileHandle(content: string) {
    const file = new File([content], 'map.trbm', { type: 'application/json' })
    return {
      getFile: vi.fn().mockResolvedValue(file),
    } as unknown as FileSystemFileHandle
  }

  function makeOversizedFileHandle(sizeBytes: number) {
    const file = new File([new Uint8Array(sizeBytes)], 'map.trbm')
    return {
      getFile: vi.fn().mockResolvedValue(file),
    } as unknown as FileSystemFileHandle
  }

  it('returns null when user cancels (AbortError)', async () => {
    vi.stubGlobal('showOpenFilePicker', vi.fn().mockRejectedValue(Object.assign(new Error('abort'), { name: 'AbortError' })))
    const adapter = new WebFsaAdapter()
    const result = await adapter.openMap()
    expect(result).toBeNull()
  })

  it('throws error containing "exceeds" when file is over 10 MB', async () => {
    const handle = makeOversizedFileHandle(10_485_761)
    vi.stubGlobal('showOpenFilePicker', vi.fn().mockResolvedValue([handle]))
    const adapter = new WebFsaAdapter()
    await expect(adapter.openMap()).rejects.toThrow(/exceeds/i)
  })

  it('throws error when file contains invalid JSON', async () => {
    const handle = makeFileHandle('{invalid json')
    vi.stubGlobal('showOpenFilePicker', vi.fn().mockResolvedValue([handle]))
    const adapter = new WebFsaAdapter()
    await expect(adapter.openMap()).rejects.toThrow()
  })

  it('throws error when JSON fails schema validation', async () => {
    const handle = makeFileHandle(JSON.stringify({ version: 1 }))
    vi.stubGlobal('showOpenFilePicker', vi.fn().mockResolvedValue([handle]))
    const adapter = new WebFsaAdapter()
    await expect(adapter.openMap()).rejects.toThrow()
  })

  it('returns mapFile and handle when file is valid', async () => {
    const handle = makeFileHandle(JSON.stringify(VALID_MAP_FILE))
    vi.stubGlobal('showOpenFilePicker', vi.fn().mockResolvedValue([handle]))
    const adapter = new WebFsaAdapter()
    const result = await adapter.openMap()
    expect(result).not.toBeNull()
    expect(result!.mapFile).toMatchObject(VALID_MAP_FILE)
    expect(result!.handle).toBe(handle)
  })
})

// ── Task 2.2: WebFsaAdapter.saveMap — silent write when handle provided ──

describe('WebFsaAdapter.saveMap', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('writes silently when handle is non-null (no showSaveFilePicker call)', async () => {
    const mockWritable = { write: vi.fn().mockResolvedValue(undefined), close: vi.fn().mockResolvedValue(undefined) }
    const handle = {
      createWritable: vi.fn().mockResolvedValue(mockWritable),
    } as unknown as FileSystemFileHandle

    const showSaveFilePicker = vi.fn()
    vi.stubGlobal('showSaveFilePicker', showSaveFilePicker)

    const adapter = new WebFsaAdapter()
    const result = await adapter.saveMap(VALID_MAP_DATA, handle)

    expect(handle.createWritable).toHaveBeenCalled()
    expect(showSaveFilePicker).not.toHaveBeenCalled()
    expect(result).toBe(handle)
  })

  it('delegates to saveMapAs when handle is null', async () => {
    const newHandle = {} as FileSystemFileHandle
    const mockWritable = { write: vi.fn().mockResolvedValue(undefined), close: vi.fn().mockResolvedValue(undefined) }
    ;(newHandle as unknown as { createWritable: () => Promise<typeof mockWritable> }).createWritable = vi.fn().mockResolvedValue(mockWritable)
    vi.stubGlobal('showSaveFilePicker', vi.fn().mockResolvedValue(newHandle))

    const adapter = new WebFsaAdapter()
    const result = await adapter.saveMap(VALID_MAP_DATA, null)

    expect(result).toBe(newHandle)
  })
})

// ── Task 2.3: WebFsaAdapter.saveMapAs ──

describe('WebFsaAdapter.saveMapAs', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns null when user cancels', async () => {
    vi.stubGlobal('showSaveFilePicker', vi.fn().mockRejectedValue(Object.assign(new Error('abort'), { name: 'AbortError' })))
    const adapter = new WebFsaAdapter()
    const result = await adapter.saveMapAs(VALID_MAP_DATA)
    expect(result).toBeNull()
  })

  it('calls showSaveFilePicker and returns handle', async () => {
    const mockWritable = { write: vi.fn().mockResolvedValue(undefined), close: vi.fn().mockResolvedValue(undefined) }
    const handle = { createWritable: vi.fn().mockResolvedValue(mockWritable) } as unknown as FileSystemFileHandle
    vi.stubGlobal('showSaveFilePicker', vi.fn().mockResolvedValue(handle))

    const adapter = new WebFsaAdapter()
    const result = await adapter.saveMapAs(VALID_MAP_DATA)

    expect(result).toBe(handle)
  })
})

// ── Task 2.4: WebFsaAdapter.checkHandleExists ──

describe('WebFsaAdapter.checkHandleExists', () => {

  it('returns true when permission is granted', async () => {
    const handle = { queryPermission: vi.fn().mockResolvedValue('granted') } as unknown as FileSystemFileHandle
    const adapter = new WebFsaAdapter()
    expect(await adapter.checkHandleExists(handle)).toBe(true)
  })

  it('returns false when permission is denied', async () => {
    const handle = { queryPermission: vi.fn().mockResolvedValue('denied') } as unknown as FileSystemFileHandle
    const adapter = new WebFsaAdapter()
    expect(await adapter.checkHandleExists(handle)).toBe(false)
  })

  it('returns false when permission is prompt', async () => {
    const handle = { queryPermission: vi.fn().mockResolvedValue('prompt') } as unknown as FileSystemFileHandle
    const adapter = new WebFsaAdapter()
    expect(await adapter.checkHandleExists(handle)).toBe(false)
  })
})

// ── Task 3.1: WebFallbackAdapter.openMap ──

describe('WebFallbackAdapter.openMap', () => {

  function setupInputMock(file: File | null) {
    let changeHandler: ((e: Event) => void) | null = null
    const mockInput = {
      style: {},
      type: '',
      accept: '',
      click: vi.fn().mockImplementation(() => {
        if (file && changeHandler) {
          const event = { target: { files: [file] } } as unknown as Event
          changeHandler(event)
        }
      }),
      addEventListener: vi.fn().mockImplementation((event: string, handler: (e: Event) => void) => {
        if (event === 'change') changeHandler = handler
      }),
      remove: vi.fn(),
    }
    vi.spyOn(document, 'createElement').mockReturnValue(mockInput as unknown as HTMLElement)
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockInput as unknown as Node)
    return mockInput
  }

  it('returns null when user cancels (no file selected)', async () => {
    setupInputMock(null)
    // Simulate cancel: click fires but no change event
    // Override to simulate no selection
    let changeHandler: ((e: Event) => void) | null = null
    const mockInput2 = {
      style: {},
      type: '',
      accept: '',
      click: vi.fn(), // does NOT fire change
      addEventListener: vi.fn().mockImplementation((ev: string, h: (e: Event) => void) => {
        if (ev === 'change') changeHandler = h
      }),
      remove: vi.fn(),
    }
    vi.spyOn(document, 'createElement').mockReturnValue(mockInput2 as unknown as HTMLElement)
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockInput2 as unknown as Node)

    const adapter2 = new WebFallbackAdapter()
    const resultPromise = adapter2.openMap()
    // Trigger the change event with empty files
    const emptyEvent = { target: { files: [] } } as unknown as Event
    const handler = changeHandler as ((e: Event) => void) | null
    if (handler) handler(emptyEvent)
    const result = await resultPromise
    expect(result).toBeNull()
  })

  it('throws error containing "exceeds" when file is over 10 MB', async () => {
    const bigContent = new Uint8Array(10_485_761)
    const file = new File([bigContent], 'map.trbm')
    setupInputMock(file)

    const adapter = new WebFallbackAdapter()
    const resultPromise = adapter.openMap()
    await expect(resultPromise).rejects.toThrow(/exceeds/i)
  })

  it('throws error when file contains invalid JSON', async () => {
    const file = new File(['{invalid'], 'map.trbm')
    setupInputMock(file)

    const adapter = new WebFallbackAdapter()
    await expect(adapter.openMap()).rejects.toThrow()
  })

  it('throws error when JSON fails schema validation', async () => {
    const file = new File([JSON.stringify({ version: 1 })], 'map.trbm')
    setupInputMock(file)

    const adapter = new WebFallbackAdapter()
    await expect(adapter.openMap()).rejects.toThrow()
  })

  it('returns mapFile and null handle for valid file', async () => {
    const file = new File([JSON.stringify(VALID_MAP_FILE)], 'map.trbm')
    setupInputMock(file)

    const adapter = new WebFallbackAdapter()
    const result = await adapter.openMap()
    expect(result).not.toBeNull()
    expect(result!.mapFile).toMatchObject(VALID_MAP_FILE)
    expect(result!.handle).toBeNull()
  })
})

// ── Task 3.2: WebFallbackAdapter.saveMap & saveMapAs ──

describe('WebFallbackAdapter.saveMap / saveMapAs', () => {

  function setupDownloadMocks() {
    const mockAnchor = { href: '', download: '', click: vi.fn(), style: {} }
    vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as unknown as HTMLElement)
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockAnchor as unknown as Node)
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockAnchor as unknown as Node)
    const mockObjectUrl = 'blob:mock'
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn().mockReturnValue(mockObjectUrl),
      revokeObjectURL: vi.fn(),
    })
    return { mockAnchor, mockObjectUrl }
  }

  it('saveMap triggers download (.click called) and revokes URL', async () => {
    const { mockAnchor } = setupDownloadMocks()
    const adapter = new WebFallbackAdapter()
    const result = await adapter.saveMap(VALID_MAP_DATA, null)
    expect(mockAnchor.click).toHaveBeenCalled()
    expect(URL.revokeObjectURL).toHaveBeenCalled()
    expect(result).toBeNull()
  })

  it('saveMapAs triggers download (.click called) and revokes URL', async () => {
    const { mockAnchor } = setupDownloadMocks()
    const adapter = new WebFallbackAdapter()
    const result = await adapter.saveMapAs(VALID_MAP_DATA)
    expect(mockAnchor.click).toHaveBeenCalled()
    expect(URL.revokeObjectURL).toHaveBeenCalled()
    expect(result).toBeNull()
  })
})

// ── Task 3.3: WebFallbackAdapter.checkHandleExists always false ──

describe('WebFallbackAdapter.checkHandleExists', () => {

  it('returns false for any handle', async () => {
    const handle = {} as FileSystemFileHandle
    const adapter = new WebFallbackAdapter()
    expect(await adapter.checkHandleExists(handle)).toBe(false)
  })
})
