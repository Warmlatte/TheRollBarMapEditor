export type Saved<T> = T & { id: string }

export type ListBinding<T> = {
  get(): Saved<T>[]
  set(next: Saved<T>[]): void
}

export type RegistryOptions<T extends object> = {
  storageKey: string
  binding: ListBinding<T>
  validate: (raw: unknown) => T | null
  isDuplicate: (a: T, b: T) => boolean
  seed?: T[]
}

export type SavedPresetRegistry<T extends object> = {
  load(): void
  save(item: T): string
  remove(id: string): void
  find(id: string): Saved<T> | undefined
}

function genId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return String(Date.now()) + Math.random().toString(36).slice(2)
}

export function createSavedPresetRegistry<T extends object>(
  opts: RegistryOptions<T>,
): SavedPresetRegistry<T> {
  const { storageKey, binding, validate, isDuplicate, seed } = opts

  function persistList(next: Saved<T>[]): void {
    localStorage.setItem(storageKey, JSON.stringify(next))
  }

  return {
    load() {
      try {
        const raw = localStorage.getItem(storageKey)
        if (raw === null) {
          if (seed && seed.length > 0) {
            const seeded: Saved<T>[] = seed.map((item) => ({ id: genId(), ...item } as Saved<T>))
            persistList(seeded)
            binding.set(seeded)
          }
          return
        }
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed)) return
        const valid: Saved<T>[] = []
        for (const item of parsed) {
          if (!item || typeof item !== 'object' || typeof (item as { id?: unknown }).id !== 'string') {
            continue
          }
          const id = (item as { id: string }).id
          const data = validate(item)
          if (data === null) continue
          valid.push({ id, ...data } as Saved<T>)
        }
        binding.set(valid)
      } catch {
        // parse failure — leave list empty, next save will overwrite
      }
    },

    save(item: T): string {
      const list = binding.get()
      const dup = list.find((s) => isDuplicate(s, item))
      if (dup) return dup.id
      const id = genId()
      const next = [...list, { id, ...item } as Saved<T>]
      persistList(next)
      binding.set(next)
      return id
    },

    remove(id: string): void {
      const next = binding.get().filter((s) => s.id !== id)
      persistList(next)
      binding.set(next)
    },

    find(id: string): Saved<T> | undefined {
      return binding.get().find((s) => s.id === id)
    },
  }
}
