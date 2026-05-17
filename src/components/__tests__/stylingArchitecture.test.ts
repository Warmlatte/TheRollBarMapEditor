import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const css = readFileSync(resolve(__dirname, '../../assets/main.css'), 'utf-8')

const sharedHudClasses = [
  'hud-btn',
  'hud-input',
  'hud-divider',
  'slider-row',
  'slabel',
  'value-mini',
  'target-btn',
  'tool-btn',
  'hud-panel',
  'icon-preview',
] as const

function componentLayerBody(source: string): string {
  const layerStart = source.indexOf('@layer components')
  expect(layerStart).toBeGreaterThanOrEqual(0)

  const firstBrace = source.indexOf('{', layerStart)
  expect(firstBrace).toBeGreaterThanOrEqual(0)

  let depth = 0
  for (let index = firstBrace; index < source.length; index += 1) {
    const char = source[index]
    if (char === '{') depth += 1
    if (char === '}') depth -= 1
    if (depth === 0) return source.slice(firstBrace + 1, index)
  }

  throw new Error('Unclosed @layer components block')
}

function countClassDefinitions(source: string, className: string): number {
  return [...source.matchAll(new RegExp(`\\.${className}\\s*\\{`, 'g'))].length
}

describe('styling architecture', () => {
  it('declares Tailwind directives in the shared entry point', () => {
    expect(css).toContain('@tailwind base;')
    expect(css).toContain('@tailwind components;')
    expect(css).toContain('@tailwind utilities;')
  })

  it('declares the shared HUD component class catalog in @layer components', () => {
    const layer = componentLayerBody(css)

    for (const className of sharedHudClasses) {
      expect(layer, `${className} should be declared in @layer components`).toMatch(
        new RegExp(`\\.${className}(?=[\\s:{.#])`),
      )
      expect(countClassDefinitions(css, className), `${className} should have one base definition`).toBe(1)
    }
  })
})
