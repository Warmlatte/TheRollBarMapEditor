import { validateMapFile } from './validate'
import type { MapFile } from './types'

export function migrateMapFile(raw: unknown): MapFile {
  const validated = validateMapFile(raw)
  if (validated.version === 1) {
    return validated
  }
  // Future versions: add migration steps here
  // if (validated.version === 2) { ... }
  throw new Error(`version: unsupported version ${String((validated as { version: unknown }).version)}`)
}
