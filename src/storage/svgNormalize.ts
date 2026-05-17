import DOMPurify from 'dompurify'

export const SVG_ALLOWED_TAGS: readonly string[] = [
  'svg', 'g', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'ellipse',
  'text', 'tspan', 'defs', 'use', 'symbol', 'clipPath', 'mask',
  'linearGradient', 'radialGradient', 'stop', 'title', 'desc',
]

export function sanitizeSvgIcon(rawSvg: string): string {
  try {
    return DOMPurify.sanitize(rawSvg, {
      USE_PROFILES: { svg: true, svgFilters: true },
      ALLOWED_TAGS: SVG_ALLOWED_TAGS as string[],
    })
  } catch {
    return ''
  }
}

export function normalizeSvgIcon(svg: string): string {
  try {
    const match = svg.match(/(<svg)(\s[^>]*)?(\/?>)/i)
    if (!match) return svg

    const [fullTag, open, attrStr = '', close] = match

    const hasViewBox = /\bviewBox\s*=/i.test(attrStr)
    const widthMatch = attrStr.match(/\bwidth\s*=\s*"([^"]*)"/i)
    const heightMatch = attrStr.match(/\bheight\s*=\s*"([^"]*)"/i)
    const width = widthMatch?.[1]
    const height = heightMatch?.[1]

    if (!hasViewBox && (!width || !height)) {
      return svg
    }

    let newAttrs = attrStr

    if (!hasViewBox && width && height) {
      newAttrs = ` viewBox="0 0 ${width} ${height}"${newAttrs}`
    }

    newAttrs = newAttrs.replace(/\s+width\s*=\s*"[^"]*"/gi, '')
    newAttrs = newAttrs.replace(/\s+height\s*=\s*"[^"]*"/gi, '')

    return svg.replace(fullTag, `${open}${newAttrs}${close}`)
  } catch {
    return svg
  }
}
