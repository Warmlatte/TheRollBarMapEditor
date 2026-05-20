// File System Access API — not yet in the standard TypeScript DOM lib
interface Window {
  showOpenFilePicker(options?: { multiple?: boolean }): Promise<FileSystemFileHandle[]>
  showSaveFilePicker(options?: {
    suggestedName?: string
    types?: ReadonlyArray<{ readonly description?: string; readonly accept?: Readonly<Record<string, ReadonlyArray<string>>> }>
  }): Promise<FileSystemFileHandle>
}

interface FileSystemFileHandle {
  queryPermission(descriptor?: { mode?: 'read' | 'readwrite' }): Promise<PermissionState>
  requestPermission(descriptor?: { mode?: 'read' | 'readwrite' }): Promise<PermissionState>
}
