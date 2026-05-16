import { describe, it, expect } from 'vitest'
import { TOOLS, getHandler } from './registry'

describe('TOOLS array 包含 5 個工具', () => {
  it('TOOLS.length === 5', () => {
    expect(TOOLS.length).toBe(5)
  })

  it('包含所有 5 個工具 id', () => {
    const ids = TOOLS.map(t => t.id)
    expect(ids).toContain('paint')
    expect(ids).toContain('icon')
    expect(ids).toContain('line')
    expect(ids).toContain('doodle')
    expect(ids).toContain('erase')
  })

  it('erase 工具 variant 為 danger', () => {
    const erase = TOOLS.find(t => t.id === 'erase')
    expect(erase).toBeDefined()
    expect(erase!.variant).toBe('danger')
  })
})

describe('getHandler 已知 toolId 回傳正確 handler', () => {
  it('所有 5 個工具 id 各自回傳對應的 handler 物件參照', () => {
    for (const tool of TOOLS) {
      expect(getHandler(tool.id)).toBe(tool.handler)
    }
  })
})

describe('getHandler 未知 toolId 丟出 Error', () => {
  it('getHandler("nonexistent") 拋出 Error', () => {
    expect(() => getHandler('nonexistent')).toThrow()
  })

  it('error message 含 "Unknown tool: nonexistent"', () => {
    expect(() => getHandler('nonexistent')).toThrow('Unknown tool: nonexistent')
  })
})
