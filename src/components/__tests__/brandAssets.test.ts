import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function expectPngFile(path: string): void {
  expect(existsSync(path)).toBe(true)

  const signature = readFileSync(path).subarray(0, 8)
  expect([...signature]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
}

describe('brand assets', () => {
  it('provides the bundled brand mark for Vue components', () => {
    expectPngFile(resolve(__dirname, '../../assets/the-roll-bar-mark-light.png'))
  })

  it('provides the public brand mark for the favicon', () => {
    expectPngFile(resolve(__dirname, '../../../public/the-roll-bar-mark-light.png'))
  })

  it('references the public brand mark as the favicon', () => {
    const html = readFileSync(resolve(__dirname, '../../../index.html'), 'utf-8')

    expect(html).toContain('<link rel="icon" type="image/png" href="/the-roll-bar-mark-light.png" />')
  })
})
