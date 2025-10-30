import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type OutputFormat = 'jpg' | 'png' | 'webp' | 'avif' | 'original'

export type Preset = 'high-quality' | 'balanced' | 'high-compression'

export type Language = 'en' | 'ja' | 'zh'

export type Theme = 'light' | 'dark' | 'system'

export interface ImageFile {
  id: string
  file: File
  preview?: string
  processed?: {
    blob: Blob
    format: OutputFormat
    width: number
    height: number
    size: number
    originalSize: number
  }
  progress: number
  status: 'pending' | 'processing' | 'completed' | 'error'
  error?: string
}

export interface AppSettings {
  preset: Preset
  outputFormat: OutputFormat
  quality: number
  maxDimension: number
  nearLossless?: boolean
  language?: Language
  theme?: Theme
}

interface AppState {
  files: ImageFile[]
  settings: AppSettings
  isProcessing: boolean
  compareModalOpen: boolean
  compareFileId?: string

  setSettings: (settings: Partial<AppSettings>) => void
  setLanguage: (language: Language) => void
  setTheme: (theme: Theme) => void
  addFiles: (files: File[]) => void
  removeFile: (id: string) => void
  updateFile: (id: string, updates: Partial<ImageFile>) => void
  clearFiles: () => void
  setProcessing: (processing: boolean) => void
  openCompareModal: (fileId: string) => void
  closeCompareModal: () => void
}

const defaultSettings: AppSettings = {
  preset: 'balanced',
  outputFormat: 'webp',
  quality: 80,
  maxDimension: 4096,
  nearLossless: false,
  language: 'en',
  theme: 'system',
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      files: [],
      settings: defaultSettings,
      isProcessing: false,
      compareModalOpen: false,
      compareFileId: undefined,

      setSettings: (partial) =>
        set((state) => ({
          settings: { ...state.settings, ...partial },
        })),

      setLanguage: (language) => {
        set((state) => {
          // i18nの言語も更新
          if (typeof window !== 'undefined') {
            import('../i18n').then((module) => {
              module.default.changeLanguage(language)
              document.documentElement.lang = language
            })
          }
          return {
            settings: { ...state.settings, language },
          }
        })
      },

      setTheme: (theme) => {
        set((state) => {
          if (typeof window !== 'undefined') {
            const root = document.documentElement
            const applyTheme = (actualTheme: 'light' | 'dark') => {
              if (actualTheme === 'dark') {
                root.classList.add('dark')
              } else {
                root.classList.remove('dark')
              }
            }

            if (theme === 'system') {
              const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
              applyTheme(mediaQuery.matches ? 'dark' : 'light')
            } else {
              applyTheme(theme)
            }
          }
          return {
            settings: { ...state.settings, theme },
          }
        })
      },

      addFiles: (newFiles) =>
        set((state) => {
          const existingIds = new Set(state.files.map((f) => f.id))
          const filesToAdd: ImageFile[] = newFiles
            .filter(
              (file) =>
                !existingIds.has(`${file.name}-${file.size}-${file.lastModified}`)
            )
            .map((file) => ({
              id: `${file.name}-${file.size}-${file.lastModified}`,
              file,
              progress: 0,
              status: 'pending' as const,
            }))

          return {
            files: [...state.files, ...filesToAdd],
          }
        }),

      removeFile: (id) =>
        set((state) => ({
          files: state.files.filter((f) => f.id !== id),
        })),

      updateFile: (id, updates) =>
        set((state) => ({
          files: state.files.map((f) =>
            f.id === id ? { ...f, ...updates } : f
          ),
        })),

      clearFiles: () =>
        set({
          files: [],
          compareModalOpen: false,
          compareFileId: undefined,
        }),

      setProcessing: (processing) =>
        set({
          isProcessing: processing,
        }),

      openCompareModal: (fileId) =>
        set({
          compareModalOpen: true,
          compareFileId: fileId,
        }),

      closeCompareModal: () =>
        set({
          compareModalOpen: false,
          compareFileId: undefined,
        }),
    }),
    {
      name: 'reimage-settings',
      partialize: (state) => ({ settings: state.settings }),
    }
  )
)

