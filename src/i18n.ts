import en from '../locales/en/common.json'
import ar from '../locales/ar/common.json'

export type Lang = 'en' | 'ar'
export const dicts = { en, ar } as const
export type Dict = typeof en

export function getByPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key]
    return undefined
  }, obj)
}

export function useDict(lang: Lang): { t: (path: string) => string; dict: Dict } {
  const dict = dicts[lang] as unknown as Dict
  const t = (path: string) => {
    const v = getByPath(dict, path)
    return typeof v === 'string' ? v : path
  }
  return { t, dict }
}

export function detectLang(): Lang {
  try {
    const saved = localStorage.getItem('torvo-lang')
    if (saved === 'ar' || saved === 'en') return saved
  } catch {
    // storage unavailable, fall through
  }
  return 'en'
}
