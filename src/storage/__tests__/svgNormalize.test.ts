import { describe, it, expect, vi } from 'vitest'
import { sanitizeSvgIcon, normalizeSvgIcon, SVG_ALLOWED_TAGS, isWhiteOrNearWhite } from '../svgNormalize'

describe('isWhiteOrNearWhite', () => {
  it('"white" is near-white', () => { expect(isWhiteOrNearWhite('white')).toBe(true) })
  it('"#ffffff" is near-white', () => { expect(isWhiteOrNearWhite('#ffffff')).toBe(true) })
  it('"#f0f0f0" is near-white', () => { expect(isWhiteOrNearWhite('#f0f0f0')).toBe(true) })
  it('"#333333" is not near-white', () => { expect(isWhiteOrNearWhite('#333333')).toBe(false) })
  it('"black" is not near-white', () => { expect(isWhiteOrNearWhite('black')).toBe(false) })
})

describe('SVG_ALLOWED_TAGS', () => {
  it('SVG_ALLOWED_TAGS is exported as a named constant', () => {
    expect(SVG_ALLOWED_TAGS).toBeDefined()
    expect(Array.isArray(SVG_ALLOWED_TAGS)).toBe(true)
  })

  it('includes required SVG structural tags', () => {
    expect(SVG_ALLOWED_TAGS.includes('path')).toBe(true)
    expect(SVG_ALLOWED_TAGS.includes('svg')).toBe(true)
    expect(SVG_ALLOWED_TAGS.includes('circle')).toBe(true)
    expect(SVG_ALLOWED_TAGS.includes('text')).toBe(true)
    expect(SVG_ALLOWED_TAGS.includes('linearGradient')).toBe(true)
  })

  it('does not include dangerous tags — script, foreignObject, iframe excluded', () => {
    expect(SVG_ALLOWED_TAGS.includes('script')).toBe(false)
    expect(SVG_ALLOWED_TAGS.includes('foreignObject')).toBe(false)
    expect(SVG_ALLOWED_TAGS.includes('iframe')).toBe(false)
  })
})

describe('sanitizeSvgIcon removes dangerous attributes and elements', () => {
  it('throws on non-SVG input — Invalid SVG error', () => {
    expect(() => sanitizeSvgIcon('not svg at all')).toThrow('Invalid SVG')
  })

  it('throws on bad input — sanitizeSvgIcon throws rather than returning empty string', () => {
    expect(() => sanitizeSvgIcon('bad input')).toThrow()
  })

  it('throws on malformed SVG parse errors', () => {
    expect(() => sanitizeSvgIcon('<svg><path></svg')).toThrow('Invalid SVG')
  })

  it('script tag is stripped — output excludes <script> and payload', () => {
    const result = sanitizeSvgIcon('<svg><script>alert(1)</script><circle r="5"/></svg>')
    expect(result).not.toContain('<script>')
    expect(result).not.toContain('alert(1)')
  })

  it('event attribute is stripped — onclick removed from output', () => {
    const result = sanitizeSvgIcon('<svg><rect onclick="evil()" width="10" height="10"/></svg>')
    expect(result).toContain('<rect')
    expect(result).not.toContain('onclick')
  })

  it('javascript: href is stripped — dangerous URI removed', () => {
    const result = sanitizeSvgIcon('<svg><path href="javascript:void(0)" d="M0 0"/></svg>')
    expect(result).not.toContain('javascript:')
  })

  it('style attribute is stripped — no style attr in output', () => {
    const result = sanitizeSvgIcon('<svg><circle style="color:red" r="5"/></svg>')
    expect(result).not.toContain('style=')
  })

  it('class attribute is stripped — no class attr in output', () => {
    const result = sanitizeSvgIcon('<svg><circle class="icon" r="5"/></svg>')
    expect(result).not.toContain('class=')
  })

  it('safe SVG preserves circle element and viewBox attribute', () => {
    const result = sanitizeSvgIcon('<svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="5"/></svg>')
    expect(result).toContain('<circle')
    expect(result).toContain('viewBox="0 0 10 10"')
  })

  it('foreignObject is stripped from output', () => {
    const result = sanitizeSvgIcon('<svg><foreignObject><div>bad</div></foreignObject><circle r="5"/></svg>')
    expect(result).not.toContain('foreignObject')
  })
})

describe('sanitizeSvgIcon detects outline versus silhouette icon style', () => {
  it('outline icon — majority shapes have stroke, unfilled shapes get fill="none" injected', () => {
    const svg = '<svg viewBox="0 0 24 24"><path stroke="black" d="M0 0 L24 24"/><circle stroke="red" r="5"/></svg>'
    const result = sanitizeSvgIcon(svg)
    expect(result).toContain('fill="none"')
  })

  it('silhouette icon — fill color values are stripped, not output', () => {
    const svg = '<svg viewBox="0 0 24 24"><path fill="black" d="M0 0"/><circle fill="#333" r="5"/></svg>'
    const result = sanitizeSvgIcon(svg)
    expect(result).not.toContain('fill="black"')
    expect(result).not.toContain('fill="#333"')
  })

  it('all stroke colors are stripped regardless of style — stroke="black" absent from output', () => {
    const svg = '<svg viewBox="0 0 24 24"><path stroke="black" d="M0 0"/></svg>'
    const result = sanitizeSvgIcon(svg)
    expect(result).not.toContain('stroke="black"')
  })

  it('stroke="none" is preserved in output', () => {
    const svg = '<svg viewBox="0 0 24 24"><circle stroke="none" fill="none" r="5"/></svg>'
    const result = sanitizeSvgIcon(svg)
    expect(result).toContain('stroke="none"')
  })

  it('fill="none" is always preserved in output', () => {
    const svg = '<svg viewBox="0 0 24 24"><circle fill="none" r="5"/></svg>'
    const result = sanitizeSvgIcon(svg)
    expect(result).toContain('fill="none"')
  })
})

describe('sanitizeSvgIcon detects and removes full-area background elements', () => {
  it('in test environment getBBox=0, background detection falls back safely — no throw', () => {
    const svg = '<svg viewBox="0 0 100 100"><path d="M0 0H100V100H0z"/><circle cx="50" cy="50" r="10"/></svg>'
    expect(() => sanitizeSvgIcon(svg)).not.toThrow()
  })

  it('removes the first shape when getBBox shows it covers the viewBox', () => {
    const originalGetBBox = SVGElement.prototype.getBBox
    SVGElement.prototype.getBBox = vi.fn(() => ({
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    } as DOMRect))

    try {
      const svg = '<svg viewBox="0 0 100 100"><path d="M0 0H100V100H0z"/><circle cx="50" cy="50" r="10"/></svg>'
      const result = sanitizeSvgIcon(svg)

      expect(result).not.toContain('M0 0H100V100H0z')
      expect(result).toContain('<circle')
    } finally {
      SVGElement.prototype.getBBox = originalGetBBox
    }
  })
})

describe('sanitizeSvgIcon replaces near-white fills with transparent', () => {
  it('fill="white" becomes fill="none" when no background detected', () => {
    const svg = '<svg viewBox="0 0 24 24"><circle fill="white" r="5"/></svg>'
    const result = sanitizeSvgIcon(svg)
    expect(result).toContain('fill="none"')
    expect(result).not.toContain('fill="white"')
  })

  it('fill="#f0f0f0" (near-white) becomes fill="none" when no background', () => {
    const svg = '<svg viewBox="0 0 24 24"><circle fill="#f0f0f0" r="5"/></svg>'
    const result = sanitizeSvgIcon(svg)
    expect(result).toContain('fill="none"')
    expect(result).not.toContain('fill="#f0f0f0"')
  })

  it('fill="#333333" (non-white) is stripped — not replaced with none', () => {
    const svg = '<svg viewBox="0 0 24 24"><circle fill="#333333" r="5"/></svg>'
    const result = sanitizeSvgIcon(svg)
    expect(result).not.toContain('fill="#333333"')
    expect(result).not.toContain('fill="none"')
  })
})

describe('normalizeSvgIcon centers SVG content visually', () => {
  it('graceful degradation when getBBox returns zero — returns inner content without <g> wrapper', () => {
    const result = normalizeSvgIcon('<svg><circle r="5"/></svg>')
    expect(typeof result).toBe('string')
    expect(result).toContain('<circle r="5"/>')
    expect(result).not.toContain('<svg')
  })

  it('full SVG wrapper is stripped — inner content returned without outer <svg>', () => {
    const result = normalizeSvgIcon('<svg viewBox="0 0 100 100"><path d="M10 10"/></svg>')
    expect(result).not.toContain('<svg')
    expect(result).toContain('<path')
  })

  it('bare inner string passed through unchanged when getBBox=0', () => {
    const result = normalizeSvgIcon('<rect x="0" y="0" width="10" height="10"/>')
    expect(result).toContain('<rect')
    expect(typeof result).toBe('string')
  })

  it('does not throw on empty string', () => {
    expect(() => normalizeSvgIcon('')).not.toThrow()
  })

  it('does not throw on non-svg string', () => {
    expect(() => normalizeSvgIcon('not svg')).not.toThrow()
  })
})
