export type AppTextSize = 'small' | 'default' | 'large'

const STORAGE_KEY = 'energystacks-text-size'
const TEXT_SIZES: AppTextSize[] = ['small', 'default', 'large']

export function useTextSize() {
  const textSize = useState<AppTextSize>('app-text-size', () => 'default')
  const initialized = useState<boolean>('app-text-size-initialized', () => false)

  function applyTextSize(size: AppTextSize) {
    textSize.value = size
    if (!import.meta.client) return

    document.documentElement.dataset.textSize = size
    localStorage.setItem(STORAGE_KEY, size)
  }

  function initializeTextSize() {
    if (!import.meta.client || initialized.value) return

    const savedSize = localStorage.getItem(STORAGE_KEY)
    const initialSize = TEXT_SIZES.includes(savedSize as AppTextSize)
      ? savedSize as AppTextSize
      : 'default'

    initialized.value = true
    applyTextSize(initialSize)
  }

  return {
    textSize: readonly(textSize),
    applyTextSize,
    initializeTextSize
  }
}
