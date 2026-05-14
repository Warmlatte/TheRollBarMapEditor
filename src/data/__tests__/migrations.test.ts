import { describe, it, expect } from 'vitest'
import { migrateMapFile } from '../migrations'
import { validateMapFile } from '../validate'

const validV1: unknown = {
  version: 1,
  name: 'test',
  bounds: { radius: 5 },
  hexes: [{ q: 0, r: 0, color: '#1a2b3c' }],
  icons: [],
  lines: [],
  doodles: [],
}

describe('migrateMapFile', () => {
  it('v1 data round-trips without modification', () => {
    const result = migrateMapFile(validV1)
    expect(result).toEqual(validV1)
  })

  it('rejects invalid input with the same Error as validateMapFile', () => {
    const invalid = { version: 2, name: '', bounds: { radius: 5 }, hexes: [], icons: [], lines: [], doodles: [] }
    let validateError: Error | undefined
    try { validateMapFile(invalid) } catch (e) { validateError = e as Error }

    let migrateError: Error | undefined
    try { migrateMapFile(invalid) } catch (e) { migrateError = e as Error }

    expect(migrateError).toBeDefined()
    expect(migrateError!.message).toBe(validateError!.message)
  })
})
