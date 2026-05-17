export const ICON_PATHS: Record<string, string> = {
  mountain:
    '<path d="M 8 85 L 28 50 L 38 62 L 50 22 L 62 55 L 72 45 L 92 85 Z"/>',
  tree:
    '<path d="M 50 18 L 38 35 L 44 35 L 32 52 L 40 52 L 25 72 L 45 72 L 45 85 L 55 85 L 55 72 L 75 72 L 60 52 L 68 52 L 56 35 L 62 35 Z"/>',
  tower:
    '<path d="M 30 82 L 30 30 L 34 30 L 34 26 L 40 26 L 40 30 L 46 30 L 46 26 L 54 26 L 54 30 L 60 30 L 60 26 L 66 26 L 66 30 L 70 30 L 70 82 L 56 82 L 56 65 Q 50 60 44 65 L 44 82 Z"/>',
  skull:
    '<path d="M 28 30 Q 50 18 72 30 L 76 50 L 72 60 L 66 60 L 66 75 L 60 75 L 60 67 L 54 67 L 54 75 L 46 75 L 46 67 L 40 67 L 40 75 L 34 75 L 34 60 L 28 60 L 24 50 Z"/>',
}

export const ICON_NAMES: ReadonlyArray<string> = Object.keys(ICON_PATHS)
