import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { buildSvgPoint, handlePointerDown } from '../pointerHandlers'
import { pixelToHex, hexToPixel, HEX_SIZE } from '../../lib/hexMath'
import type { ToolContext, ToolHandler } from '../toolHandlers/types'
import type { Pinia } from 'pinia'

vi.mock('../../storage/svgNormalize', () => ({
  sanitizeSvgIcon: vi.fn((s: string) => s),
  normalizeSvgIcon: vi.fn((s: string) => s),
}))

// ────────── helpers ──────────

function makeMockSvg(inv: { a: number; b: number; c: number; d: number; e: number; f: number }) {
  return {
    getScreenCTM: () => ({
      inverse: () => inv,
    }),
    createSVGPoint() {
      let px = 0
      let py = 0
      return {
        get x() { return px },
        set x(v: number) { px = v },
        get y() { return py },
        set y(v: number) { py = v },
        matrixTransform(m: typeof inv) {
          return {
            x: m.a * px + m.c * py + m.e,
            y: m.b * px + m.d * py + m.f,
          }
        },
      }
    },
  } as unknown as SVGSVGElement
}

function makeHandler(): ToolHandler & { calls: string[] } {
  const calls: string[] = []
  return {
    calls,
    onPointerDown: vi.fn(() => { calls.push('down') }),
    onPointerMove: vi.fn(() => { calls.push('move') }),
    onPointerUp: vi.fn(() => { calls.push('up') }),
  }
}

// ────────── 5.1 svgPoint ──────────

describe('ToolContext svgPoint converts screen to SVG coordinates', () => {
  it('zoom=2, no pan: screen (200, 100) → SVG (100, 50)', () => {
    const svg = makeMockSvg({ a: 0.5, b: 0, c: 0, d: 0.5, e: 0, f: 0 })
    const svgPoint = buildSvgPoint(svg)
    const result = svgPoint({ clientX: 200, clientY: 100 } as PointerEvent)
    expect(result.x).toBeCloseTo(100, 1)
    expect(result.y).toBeCloseTo(50, 1)
  })

  it('zoom=2, pan=(50,50): screen (300, 200) → SVG (125, 75)', () => {
    // inverse CTM for forward {a:2,b:0,c:0,d:2,e:50,f:50} is {a:0.5,b:0,c:0,d:0.5,e:-25,f:-25}
    const svg = makeMockSvg({ a: 0.5, b: 0, c: 0, d: 0.5, e: -25, f: -25 })
    const svgPoint = buildSvgPoint(svg)
    const result = svgPoint({ clientX: 300, clientY: 200 } as PointerEvent)
    expect(result.x).toBeCloseTo(125, 1)
    expect(result.y).toBeCloseTo(75, 1)
  })

  it('falls back to getBoundingClientRect when getScreenCTM returns null', () => {
    const svg = {
      getScreenCTM: () => null,
      getBoundingClientRect: () => ({ left: 10, top: 20 }),
    } as unknown as SVGSVGElement
    const svgPoint = buildSvgPoint(svg)
    const result = svgPoint({ clientX: 110, clientY: 120 } as PointerEvent)
    expect(result.x).toBeCloseTo(100, 1)
    expect(result.y).toBeCloseTo(100, 1)
  })
})

// ────────── 5.2 pixelToHex / hexToPixel ──────────

describe('ToolContext pixelToHex and hexToPixel are inverse functions', () => {
  const hexCenters = [
    { q: 0, r: 0 },
    { q: 1, r: 0 },
    { q: 0, r: 1 },
    { q: -1, r: 1 },
    { q: 2, r: -1 },
    { q: -2, r: 2 },
  ]

  for (const { q, r } of hexCenters) {
    it(`round-trip for hex (${q}, ${r}) has error < 0.5px`, () => {
      const center = hexToPixel(q, r, HEX_SIZE)
      const recovered = pixelToHex(center.x, center.y, HEX_SIZE)
      const backToPixel = hexToPixel(recovered.q, recovered.r, HEX_SIZE)
      expect(Math.abs(backToPixel.x - center.x)).toBeLessThan(0.5)
      expect(Math.abs(backToPixel.y - center.y)).toBeLessThan(0.5)
    })
  }
})

// ────────── 5.3 right-click ──────────

describe('Right-click does not trigger map operations', () => {
  it('button=2 does not call onPointerDown handler', () => {
    const handler = makeHandler()
    const svg = { setPointerCapture: vi.fn() } as unknown as SVGSVGElement
    const e = { button: 2 } as PointerEvent
    handlePointerDown(e, svg, handler, () => ({} as ToolContext))
    expect(handler.onPointerDown).not.toHaveBeenCalled()
  })

  it('button=2 does not call setPointerCapture', () => {
    const handler = makeHandler()
    const svg = { setPointerCapture: vi.fn() } as unknown as SVGSVGElement
    const e = { button: 2 } as PointerEvent
    handlePointerDown(e, svg, handler, () => ({} as ToolContext))
    expect(svg.setPointerCapture).not.toHaveBeenCalled()
  })

  it('button=1 (middle) does not call handler', () => {
    const handler = makeHandler()
    const svg = { setPointerCapture: vi.fn() } as unknown as SVGSVGElement
    const e = { button: 1 } as PointerEvent
    handlePointerDown(e, svg, handler, () => ({} as ToolContext))
    expect(handler.onPointerDown).not.toHaveBeenCalled()
  })
})

// ────────── 5.4 pointer capture ──────────

describe('HexCanvas uses pointer capture to prevent lost events', () => {
  it('button=0 calls setPointerCapture with the pointerId', () => {
    const handler = makeHandler()
    const svg = { setPointerCapture: vi.fn() } as unknown as SVGSVGElement
    const e = { button: 0, pointerId: 42 } as unknown as PointerEvent
    handlePointerDown(e, svg, handler, () => ({} as ToolContext))
    expect(svg.setPointerCapture).toHaveBeenCalledWith(42)
  })

  it('button=0 calls onPointerDown on the handler', () => {
    const handler = makeHandler()
    const svg = { setPointerCapture: vi.fn() } as unknown as SVGSVGElement
    const e = { button: 0, pointerId: 1 } as unknown as PointerEvent
    handlePointerDown(e, svg, handler, () => ({} as ToolContext))
    expect(handler.onPointerDown).toHaveBeenCalledOnce()
  })
})

describe('HexCanvas icon rendering follows the SVG library styling contract', () => {
  let pinia: Pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
  })

  it('renders placed icons by resolving svgId from the icon library with inherited color and original viewBox transform', async () => {
    const { useMapStore } = await import('../../stores/mapStore')
    const { useIconLibraryStore } = await import('../../stores/iconLibraryStore')
    const { default: HexCanvas } = await import('../HexCanvas.vue')
    const mapStore = useMapStore()
    const libStore = useIconLibraryStore()
    libStore.icons = [
      {
        id: 'mountain',
        rawSvg: '<svg viewBox="0 0 100 100"><path d="M 8 85 L 50 22 L 92 85 Z"/></svg>',
        name: 'mountain',
        createdAt: 1000,
      },
    ]
    mapStore.loadMapData({
      name: 'icons',
      bounds: { radius: 1 },
      hexes: [],
      icons: [
        {
          id: 'icon-1',
          x: 0,
          y: 0,
          svgId: 'mountain',
          size: 60,
          rotation: 30,
          color: '#775533',
        },
      ],
      lines: [],
      doodles: [],
    })

    const wrapper = mount(HexCanvas, {
      global: { plugins: [pinia] },
      attachTo: document.body,
    })

    const iconGroup = wrapper.find('[data-testid="placed-icon-icon-1"]')
    expect(iconGroup.exists()).toBe(true)
    expect(iconGroup.attributes('fill')).toBe('#775533')
    expect(iconGroup.attributes('stroke')).toBe('#775533')
    expect(iconGroup.attributes('transform')).toContain('scale(0.6)')
    expect(iconGroup.attributes('transform')).toContain('translate(-50,-50)')
    expect(iconGroup.html()).toContain('path')
    wrapper.unmount()
  })
})
