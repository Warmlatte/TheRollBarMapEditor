import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { WorkspaceData } from '@/storage/persist'
import { saveWorkspace, loadWorkspace } from '@/storage/persist'

const SAMPLE_WORKSPACE: WorkspaceData = {
  tabs: [{ id: 'tab-1', name: 'Map 1', mapData: { name: 'Map 1', bounds: { radius: 3 }, hexes: [], icons: [], lines: [], doodles: [] } }],
  activeTabId: 'tab-1',
}

const WORKSPACE_KEY = 'hexmap.workspace.v1'
const WORKSPACE_BAK_KEY = 'hexmap.workspace.v1.bak'

// ── Task 4.1: saveWorkspace dual-key backup ──

describe('saveWorkspace', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('writes to both primary and .bak keys', () => {
    saveWorkspace(SAMPLE_WORKSPACE)
    expect(localStorage.getItem(WORKSPACE_KEY)).not.toBeNull()
    expect(localStorage.getItem(WORKSPACE_BAK_KEY)).not.toBeNull()
  })

  it('both keys contain the same serialized data', () => {
    saveWorkspace(SAMPLE_WORKSPACE)
    const primary = localStorage.getItem(WORKSPACE_KEY)
    const bak = localStorage.getItem(WORKSPACE_BAK_KEY)
    expect(primary).toBe(bak)
    expect(JSON.parse(primary!)).toMatchObject(SAMPLE_WORKSPACE)
  })

  it('writes .bak before primary key (write order)', () => {
    const order: string[] = []
    const originalSetItem = localStorage.setItem.bind(localStorage)
    vi.spyOn(localStorage, 'setItem').mockImplementation((key: string, value: string) => {
      order.push(key)
      originalSetItem(key, value)
    })
    saveWorkspace(SAMPLE_WORKSPACE)
    expect(order[0]).toBe(WORKSPACE_BAK_KEY)
    expect(order[1]).toBe(WORKSPACE_KEY)
  })
})

// ── Task 4.2: loadWorkspace recovery scenarios ──

describe('loadWorkspace', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns parsed data from primary key when valid', () => {
    localStorage.setItem(WORKSPACE_KEY, JSON.stringify(SAMPLE_WORKSPACE))
    localStorage.setItem(WORKSPACE_BAK_KEY, JSON.stringify({ tabs: [], activeTabId: null }))
    const result = loadWorkspace()
    expect(result).toMatchObject(SAMPLE_WORKSPACE)
  })

  it('recovers from .bak when primary key is missing', () => {
    localStorage.setItem(WORKSPACE_BAK_KEY, JSON.stringify(SAMPLE_WORKSPACE))
    const result = loadWorkspace()
    expect(result).toMatchObject(SAMPLE_WORKSPACE)
  })

  it('recovers from .bak when primary key is malformed JSON', () => {
    localStorage.setItem(WORKSPACE_KEY, '{invalid json')
    localStorage.setItem(WORKSPACE_BAK_KEY, JSON.stringify(SAMPLE_WORKSPACE))
    const result = loadWorkspace()
    expect(result).toMatchObject(SAMPLE_WORKSPACE)
  })

  it('returns null when both keys are missing', () => {
    const result = loadWorkspace()
    expect(result).toBeNull()
  })

  it('returns null when both keys contain malformed JSON', () => {
    localStorage.setItem(WORKSPACE_KEY, '{bad')
    localStorage.setItem(WORKSPACE_BAK_KEY, '{also bad')
    const result = loadWorkspace()
    expect(result).toBeNull()
  })
})
