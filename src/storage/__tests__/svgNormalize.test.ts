import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('dompurify', () => ({
  default: { sanitize: vi.fn() },
}))

import DOMPurify from 'dompurify'
import { sanitizeSvgIcon, normalizeSvgIcon } from '../svgNormalize'

describe('sanitizeSvgIcon', () => {
  beforeEach(() => {
    vi.mocked(DOMPurify.sanitize).mockClear()
  })

  it('calls DOMPurify.sanitize with SVG profile', () => {
    vi.mocked(DOMPurify.sanitize).mockReturnValue('<svg/>')
    sanitizeSvgIcon('<svg/>')
    expect(DOMPurify.sanitize).toHaveBeenCalledWith('<svg/>', {
      USE_PROFILES: { svg: true, svgFilters: true },
    })
  })

  it('script tag is stripped — returns DOMPurify result without <script>', () => {
    const input = '<svg><script>alert(1)</script><circle r="5"/></svg>'
    vi.mocked(DOMPurify.sanitize).mockReturnValue('<svg><circle r="5"/></svg>')
    const result = sanitizeSvgIcon(input)
    expect(result).not.toContain('<script>')
    expect(result).toContain('<circle r="5"/>')
  })

  it('event attribute is stripped — returns DOMPurify result without onclick', () => {
    vi.mocked(DOMPurify.sanitize).mockReturnValue('<svg><rect width="10" height="10"/></svg>')
    const result = sanitizeSvgIcon('<svg><rect onclick="evil()" width="10" height="10"/></svg>')
    expect(result).toContain('<rect')
    expect(result).not.toContain('onclick')
  })

  it('safe SVG passes through — circle is preserved', () => {
    const safe = '<svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="5"/></svg>'
    vi.mocked(DOMPurify.sanitize).mockReturnValue(safe)
    const result = sanitizeSvgIcon(safe)
    expect(result).toContain('<circle')
    expect(result).toContain('viewBox="0 0 10 10"')
  })

  it('does not throw on empty input', () => {
    vi.mocked(DOMPurify.sanitize).mockReturnValue('')
    expect(() => sanitizeSvgIcon('')).not.toThrow()
  })

  it('does not throw on non-svg string', () => {
    vi.mocked(DOMPurify.sanitize).mockReturnValue('')
    expect(() => sanitizeSvgIcon('not svg at all')).not.toThrow()
  })
})

describe('normalizeSvgIcon', () => {
  it('derives viewBox from width and height, removes both dimension attributes', () => {
    const result = normalizeSvgIcon('<svg width="24" height="24"><circle r="10"/></svg>')
    expect(result).toContain('viewBox="0 0 24 24"')
    expect(result).not.toMatch(/\bwidth=/)
    expect(result).not.toMatch(/\bheight=/)
    expect(result).toContain('<circle r="10"/>')
  })

  it('preserves existing viewBox and removes fixed dimensions', () => {
    const result = normalizeSvgIcon('<svg viewBox="0 0 100 100" width="50" height="50"><rect/></svg>')
    expect(result).toContain('viewBox="0 0 100 100"')
    expect(result).not.toMatch(/\bwidth=/)
    expect(result).not.toMatch(/\bheight=/)
  })

  it('passes through unchanged when no viewBox and no dimensions', () => {
    const input = '<svg><circle r="5"/></svg>'
    const result = normalizeSvgIcon(input)
    expect(result).toContain('<circle')
    expect(result).toBe(input)
  })

  it('does not throw on empty string', () => {
    expect(() => normalizeSvgIcon('')).not.toThrow()
  })

  it('does not throw on non-svg string', () => {
    expect(() => normalizeSvgIcon('not svg')).not.toThrow()
  })

  it('returns string containing circle even when no viewBox or dimensions', () => {
    const result = normalizeSvgIcon('<svg><circle r="5"/></svg>')
    expect(typeof result).toBe('string')
    expect(result).toContain('<circle r="5"/>')
  })
})
