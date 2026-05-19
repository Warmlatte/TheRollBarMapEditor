const ALLOWED_TAGS = new Set<string>([
  'svg', 'g', 'path', 'rect', 'circle', 'ellipse', 'polygon', 'polyline', 'line',
  'defs', 'title', 'desc', 'text', 'tspan', 'use', 'symbol', 'clipPath', 'mask',
  'linearGradient', 'radialGradient', 'stop',
])

const ALLOWED_TAG_LOOKUP = new Set([...ALLOWED_TAGS].map((tag) => tag.toLowerCase()))

// Attribute names are lowercased before lookup; original case is preserved in output.
const ALLOWED_ATTRS = new Set<string>([
  'd', 'x', 'y', 'cx', 'cy', 'r', 'rx', 'ry', 'width', 'height', 'points',
  'x1', 'y1', 'x2', 'y2',
  'fill', 'stroke', 'stroke-width', 'opacity', 'transform', 'fill-opacity', 'stroke-opacity',
  'fill-rule', 'clip-rule', 'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit',
  'stroke-dasharray', 'stroke-dashoffset',
  'viewbox', 'xmlns', 'xmlns:xlink', 'href', 'xlink:href', 'gradientunits', 'gradienttransform',
  'spreadmethod', 'offset', 'stop-color', 'stop-opacity',
  'preserveaspectratio', 'clip-path', 'mask',
])

const SHAPE_TAGS = new Set<string>([
  'path', 'rect', 'circle', 'ellipse', 'polygon', 'polyline', 'line',
])

export const SVG_ALLOWED_TAGS: readonly string[] = [...ALLOWED_TAGS]

function isDangerousUri(value: string): boolean {
  const lower = value.trim().toLowerCase()
  return (
    lower.startsWith('javascript:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('data:text/html')
  )
}

function hasMalformedClosingTag(rawSvg: string): boolean {
  const stack: string[] = []
  for (const match of rawSvg.matchAll(/<\s*(\/)?\s*([a-zA-Z][\w:-]*)([^>]*)>/g)) {
    const [, closing, rawName, rest] = match
    const name = rawName.toLowerCase()
    if (rest.trim().endsWith('/')) continue

    if (closing) {
      if (stack.pop() !== name) return true
    } else {
      stack.push(name)
    }
  }
  return stack.length !== 0
}


// Uses canvas for CSS color normalization with hex/rgb/named-color fallback.
export function isWhiteOrNearWhite(color: string): boolean {
  let r = 0, g = 0, b = 0, resolved = false

  if (typeof document !== 'undefined') {
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 1
      canvas.height = 1
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.fillStyle = '#000000'
        ctx.fillStyle = color
        const normalized = ctx.fillStyle as string
        const hexMatch = normalized.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i)
        if (hexMatch) {
          r = parseInt(hexMatch[1], 16)
          g = parseInt(hexMatch[2], 16)
          b = parseInt(hexMatch[3], 16)
          resolved = true
        } else {
          const rgbMatch = normalized.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/)
          if (rgbMatch) {
            r = parseInt(rgbMatch[1])
            g = parseInt(rgbMatch[2])
            b = parseInt(rgbMatch[3])
            resolved = true
          }
        }
      }
    } catch {
      resolved = false
    }
  }

  // Fallback keeps common authoring formats deterministic in test and non-canvas environments.
  if (!resolved) {
    const c = color.trim().toLowerCase()
    const hex6 = c.match(/^#([0-9a-f]{6})$/)
    const hex3 = c.match(/^#([0-9a-f]{3})$/)
    const rgbMatch = c.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
    if (hex6) {
      r = parseInt(hex6[1].slice(0, 2), 16)
      g = parseInt(hex6[1].slice(2, 4), 16)
      b = parseInt(hex6[1].slice(4, 6), 16)
      resolved = true
    } else if (hex3) {
      r = parseInt(hex3[1][0] + hex3[1][0], 16)
      g = parseInt(hex3[1][1] + hex3[1][1], 16)
      b = parseInt(hex3[1][2] + hex3[1][2], 16)
      resolved = true
    } else if (rgbMatch) {
      r = parseInt(rgbMatch[1])
      g = parseInt(rgbMatch[2])
      b = parseInt(rgbMatch[3])
      resolved = true
    } else if (c === 'white') {
      r = 255; g = 255; b = 255; resolved = true
    }
  }

  if (!resolved) return false
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 >= 0.85
}

let _helperSvg: SVGSVGElement | null = null

function ensureHelperSvg(): SVGSVGElement | null {
  if (typeof document === 'undefined') return null
  if (_helperSvg && document.body?.contains(_helperSvg)) return _helperSvg
  try {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGSVGElement
    el.style.position = 'absolute'
    el.style.left = '-99999px'
    el.style.width = '0'
    el.style.height = '0'
    el.style.overflow = 'hidden'
    document.body.appendChild(el)
    _helperSvg = el
    return el
  } catch {
    return null
  }
}

// Returns the first shape element if it covers at least 95% of viewBox area.
// getBBox() returns 0 in test environments, so this safely returns null.
function detectBackgroundElement(root: Element): Element | null {
  try {
    const helper = ensureHelperSvg()
    if (!helper) return null

    const viewBoxAttr = root.getAttribute('viewBox')
    if (!viewBoxAttr) return null

    const parts = viewBoxAttr.trim().split(/[\s,]+/)
    if (parts.length < 4) return null

    const vbWidth = parseFloat(parts[2])
    const vbHeight = parseFloat(parts[3])
    if (!vbWidth || !vbHeight) return null

    const viewBoxArea = vbWidth * vbHeight
    const shapeSelector = [...SHAPE_TAGS].join(',')
    const firstOrigShape = root.querySelector(shapeSelector)
    if (!firstOrigShape) return null

    helper.setAttribute('viewBox', viewBoxAttr)
    helper.innerHTML = root.innerHTML

    const firstHelperShape = helper.querySelector(shapeSelector) as SVGGraphicsElement | null
    if (!firstHelperShape) return null

    const bbox = firstHelperShape.getBBox()
    const bboxArea = bbox.width * bbox.height
    if (!bboxArea) return null

    return bboxArea / viewBoxArea >= 0.95 ? firstOrigShape : null
  } catch {
    return null
  }
}

// Classifies icon as 'outline' if >50% of shapes have a non-none stroke.
function detectIconStyle(root: Element, bgEl: Element | null): 'outline' | 'silhouette' {
  const shapeSelector = [...SHAPE_TAGS].join(',')
  const allShapes = Array.from(root.querySelectorAll(shapeSelector))
  const shapes = bgEl ? allShapes.filter((el) => el !== bgEl) : allShapes

  if (shapes.length === 0) return 'silhouette'

  const withStroke = shapes.filter((el) => {
    const stroke = el.getAttribute('stroke')
    return stroke !== null && stroke !== '' && stroke !== 'none'
  })

  return withStroke.length / shapes.length > 0.5 ? 'outline' : 'silhouette'
}

function serializeClean(
  el: Element,
  bgEl: Element | null,
  iconStyle: 'outline' | 'silhouette',
  whiteAsTransparent: boolean,
): string {
  if (el === bgEl) return ''

  const tag = el.localName
  const tagKey = tag.toLowerCase()
  if (!ALLOWED_TAG_LOOKUP.has(tagKey)) return ''

  const isShape = SHAPE_TAGS.has(tagKey)
  const hadFillAttr = el.hasAttribute('fill')

  let attrs = ''

  for (const attr of Array.from(el.attributes)) {
    const attrName = attr.name.toLowerCase()

    if (attrName === 'class' || attrName === 'style' || attrName.startsWith('on')) continue
    if ((attrName === 'href' || attrName === 'xlink:href') && isDangerousUri(attr.value)) continue
    if (!ALLOWED_ATTRS.has(attrName)) continue

    // Strip all stroke colors except stroke="none"
    if (attrName === 'stroke') {
      if (attr.value === 'none') attrs += ' stroke="none"'
      continue
    }

    // Handle fill on shape elements with style-aware logic
    if (attrName === 'fill' && isShape) {
      const fv = attr.value
      if (fv === 'none') {
        attrs += ' fill="none"'
      } else if (whiteAsTransparent && isWhiteOrNearWhite(fv)) {
        attrs += ' fill="none"'
      }
      // Other fill colors: strip (don't output)
      continue
    }

    attrs += ` ${attr.name}="${attr.value.replace(/"/g, '&quot;')}"`
  }

  // Outline shapes with no fill attribute get fill="none" injected
  if (isShape && iconStyle === 'outline' && !hadFillAttr) {
    attrs += ' fill="none"'
  }

  let children = ''
  for (const child of Array.from(el.childNodes)) {
    if (child.nodeType === 1) {
      children += serializeClean(child as Element, bgEl, iconStyle, whiteAsTransparent)
    } else if (child.nodeType === 3) {
      const text = child.textContent ?? ''
      children += text.replace(/[<>&]/g, (c) => (c === '<' ? '&lt;' : c === '>' ? '&gt;' : '&amp;'))
    }
  }

  return children ? `<${tag}${attrs}>${children}</${tag}>` : `<${tag}${attrs}/>`
}

export function sanitizeSvgIcon(rawSvg: string): string {
  if (typeof DOMParser === 'undefined') throw new Error('Invalid SVG')

  const trimmed = rawSvg.trim()
  if (hasMalformedClosingTag(trimmed)) throw new Error('Invalid SVG')
  const doc = new DOMParser().parseFromString(trimmed, 'image/svg+xml')
  if (doc.querySelector('parsererror')) throw new Error('Invalid SVG')

  const root = doc.documentElement ?? doc.firstElementChild
  if (!root || root.localName.toLowerCase() !== 'svg') throw new Error('Invalid SVG')

  const bgEl = detectBackgroundElement(root)
  const iconStyle = detectIconStyle(root, bgEl)
  const whiteAsTransparent = bgEl === null

  return serializeClean(root, bgEl, iconStyle, whiteAsTransparent)
}

function stripSvgWrapper(input: string): string {
  const trimmed = input.trim()
  if (!trimmed.toLowerCase().startsWith('<svg')) return trimmed

  const openTagEnd = trimmed.indexOf('>')
  if (openTagEnd === -1) return trimmed

  const closingTag = trimmed.lastIndexOf('</svg>')
  if (closingTag === -1) return ''

  return trimmed.slice(openTagEnd + 1, closingTag)
}

export function normalizeSvgIcon(svgOrInner: string): string {
  const inner = stripSvgWrapper(svgOrInner)

  const helper = ensureHelperSvg()
  if (!helper) return inner

  try {
    helper.innerHTML = inner
    const bbox = (helper as unknown as SVGGraphicsElement).getBBox()

    if (!bbox.width || !bbox.height) return inner

    const scale = 80 / Math.max(bbox.width, bbox.height)
    const cx = bbox.x + bbox.width / 2
    const cy = bbox.y + bbox.height / 2
    const tx = 50 - cx * scale
    const ty = 50 - cy * scale

    return `<g transform="translate(${tx} ${ty}) scale(${scale})">${inner}</g>`
  } catch {
    return inner
  }
}
