export const NEWS_PLACEHOLDER_IMAGE = '/news-placeholder.svg'

export function getArticleSourceLogo(sourceUrl: string | null | undefined, assetsBaseUrl: string) {
  if (!sourceUrl || !assetsBaseUrl) return null

  try {
    const hostname = new URL(sourceUrl).hostname.replace(/^www\./, '')
    const logoByDomain: Record<string, string> = {
      'worldoil.com': 'worldoil.png',
      'oilprice.com': 'oilprice.png',
      'jpt.spe.org': 'jpt.svg'
    }
    const domain = Object.keys(logoByDomain).find(
      candidate => hostname === candidate || hostname.endsWith(`.${candidate}`)
    )

    if (!domain) return null

    const baseUrl = assetsBaseUrl.replace(/\/$/, '')
    return `${baseUrl}/news-assets/media_logos/${logoByDomain[domain]}`
  } catch {
    return null
  }
}

export function getNewsImage(item: any, assetsBaseUrl: string) {
  return item?.banner_url?.trim()
    || getArticleSourceLogo(item?.source_url || item?.url, assetsBaseUrl)
    || NEWS_PLACEHOLDER_IMAGE
}

export function handleNewsImageError(
  event: Event,
  sourceUrl: string | null | undefined,
  assetsBaseUrl: string
) {
  const image = event.currentTarget as HTMLImageElement
  const sourceLogo = getArticleSourceLogo(sourceUrl, assetsBaseUrl)

  if (sourceLogo && image.dataset.sourceFallbackAttempted !== 'true') {
    image.dataset.sourceFallbackAttempted = 'true'
    image.src = sourceLogo
    return
  }

  image.onerror = null
  image.src = NEWS_PLACEHOLDER_IMAGE
}
