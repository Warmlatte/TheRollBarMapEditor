import type { MapData, MapFile } from '@/data/types'
import { validateMapFile } from '@/data/validate'

const MAX_FILE_SIZE = 10_485_760 // 10 MiB

const SAVE_FILE_PICKER_OPTS = {
  suggestedName: 'map.trbm',
  types: [{ description: 'TRBM Map', accept: { 'application/json': ['.trbm'] } }],
} as const

export interface StorageAdapter {
  openMap(): Promise<{ mapFile: MapFile; handle: FileSystemFileHandle | null } | null>
  saveMap(mapData: MapData, handle: FileSystemFileHandle | null): Promise<FileSystemFileHandle | null>
  saveMapAs(mapData: MapData): Promise<FileSystemFileHandle | null>
  checkHandleExists(handle: FileSystemFileHandle): Promise<boolean>
}

async function applyValidationGate(file: File): Promise<MapFile> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds the 10 MB limit (${file.size} bytes)`)
  }
  const text = await file.text()
  const parsed: unknown = JSON.parse(text)
  return validateMapFile(parsed)
}

async function writeToHandle(handle: FileSystemFileHandle, mapData: MapData): Promise<void> {
  const json = JSON.stringify(mapData)
  const writable = await handle.createWritable()
  await writable.write(json)
  await writable.close()
}

export class WebFsaAdapter implements StorageAdapter {
  async openMap(): Promise<{ mapFile: MapFile; handle: FileSystemFileHandle } | null> {
    let handles: FileSystemFileHandle[]
    try {
      handles = await window.showOpenFilePicker({ multiple: false })
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return null
      throw err
    }
    const handle = handles[0]
    const file = await handle.getFile()
    const mapFile = await applyValidationGate(file)
    return { mapFile, handle }
  }

  async saveMap(mapData: MapData, handle: FileSystemFileHandle | null): Promise<FileSystemFileHandle | null> {
    if (handle === null) return this.saveMapAs(mapData)
    await writeToHandle(handle, mapData)
    return handle
  }

  async saveMapAs(mapData: MapData): Promise<FileSystemFileHandle | null> {
    let handle: FileSystemFileHandle
    try {
      handle = await window.showSaveFilePicker(SAVE_FILE_PICKER_OPTS)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return null
      throw err
    }
    await writeToHandle(handle, mapData)
    return handle
  }

  async checkHandleExists(handle: FileSystemFileHandle): Promise<boolean> {
    const permission = await handle.queryPermission({ mode: 'readwrite' })
    return permission === 'granted'
  }
}

export class WebFallbackAdapter implements StorageAdapter {
  openMap(): Promise<{ mapFile: MapFile; handle: null } | null> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input') as HTMLInputElement
      input.type = 'file'
      input.accept = '.trbm'
      input.style.display = 'none'

      input.addEventListener('change', (e: Event) => {
        const target = e.target as HTMLInputElement
        const file = target.files?.[0]
        input.remove()
        if (!file) {
          resolve(null)
          return
        }
        applyValidationGate(file)
          .then((mapFile) => resolve({ mapFile, handle: null }))
          .catch(reject)
      })

      document.body.appendChild(input)
      input.click()
    })
  }

  async saveMap(mapData: MapData, _handle: FileSystemFileHandle | null): Promise<null> {
    return this._triggerDownload(mapData)
  }

  async saveMapAs(mapData: MapData): Promise<null> {
    return this._triggerDownload(mapData)
  }

  private _triggerDownload(mapData: MapData): null {
    const json = JSON.stringify(mapData)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a') as HTMLAnchorElement
    a.href = url
    a.download = 'map.trbm'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    return null
  }

  async checkHandleExists(_handle: FileSystemFileHandle): Promise<boolean> {
    return false
  }
}

export function getStorageAdapter(): StorageAdapter {
  if ('showOpenFilePicker' in window) {
    return new WebFsaAdapter()
  }
  return new WebFallbackAdapter()
}
