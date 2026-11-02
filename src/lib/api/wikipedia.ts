import type { City } from '../../types'
import { APP_AGENT, cached, fetchJson, HttpError } from './http'

export interface WikiSummary {
  title: string
  extract: string
  /** 작은 썸네일(330px) */
  imageUrl?: string
  /** 원본 이미지 주소와 너비 (고화질 사진용, TODO 7-3) */
  originalUrl?: string
  originalWidth?: number
  pageUrl: string
  lang: string
}

interface RawSummary {
  type?: string
  title?: string
  extract?: string
  thumbnail?: { source?: string }
  originalimage?: { source?: string; width?: number }
  content_urls?: { desktop?: { page?: string } }
}

export function summaryUrl(lang: string, title: string): string {
  return `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replaceAll(' ', '_'))}`
}

/** 위키백과 요약 응답 → 화면용. 동음이의 문서나 내용 없는 문서는 null. */
export function parseSummary(raw: RawSummary, lang: string): WikiSummary | null {
  if (!raw.title || !raw.extract?.trim() || raw.type === 'disambiguation') return null
  return {
    title: raw.title,
    extract: raw.extract.trim(),
    imageUrl: raw.thumbnail?.source,
    originalUrl: raw.originalimage?.source,
    originalWidth: raw.originalimage?.width,
    pageUrl: raw.content_urls?.desktop?.page ?? `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(raw.title)}`,
    lang,
  }
}

async function fetchSummary(lang: string, title: string): Promise<WikiSummary | null> {
  try {
    const raw = await fetchJson<RawSummary>(summaryUrl(lang, title), { headers: { 'Api-User-Agent': APP_AGENT } })
    return parseSummary(raw, lang)
  } catch (e) {
    if (e instanceof HttpError && e.status === 404) return null
    throw e
  }
}

/** 도시 소개: 한국어 위키백과 우선, 없으면 영어 (TODO 2-2) */
export function loadCitySummary(city: City): Promise<WikiSummary | null> {
  // v2: 고화질 사진용 원본 정보가 들어가면서 예전 캐시와 구분한다
  return cached(`wiki:city:v2:${city.id}`, async () => {
    const ko = await fetchSummary('ko', city.wikiTitle ?? city.name)
    if (ko?.imageUrl) return ko
    // 한국어 문서에 사진이 없으면(예: 나짱) 영어 문서의 사진을 빌려 쓴다
    const en = await fetchSummary('en', city.nameEn)
    return ko ? { ...ko, imageUrl: en?.imageUrl, originalUrl: en?.originalUrl, originalWidth: en?.originalWidth } : en
  })
}

/**
 * 원하는 너비의 사진 주소 (TODO 7-3). 위키미디어는 정해진 너비(330·500·960·1280 등)의 썸네일을 만들어 주므로
 * 썸네일 주소의 "330px-"를 바꾼다. 원본이 그보다 작으면 원본을 그대로 쓴다(늘려 봐야 흐려짐).
 */
export function sizedImageUrl(summary: Pick<WikiSummary, 'imageUrl' | 'originalUrl' | 'originalWidth'>, width: 500 | 960 | 1280): string | undefined {
  if (summary.originalUrl && summary.originalWidth && summary.originalWidth <= width) return summary.originalUrl
  if (summary.imageUrl && /\/\d+px-/.test(summary.imageUrl)) return summary.imageUrl.replace(/\/\d+px-/, `/${width}px-`)
  return summary.originalUrl ?? summary.imageUrl
}

/** 사진 출처(라이선스) 페이지: 위키미디어 공용의 파일 설명 페이지 */
export function imageCreditUrl(summary: Pick<WikiSummary, 'originalUrl' | 'imageUrl'>): string | undefined {
  const url = summary.originalUrl ?? summary.imageUrl
  if (!url) return undefined
  const path = new URL(url).pathname
  // .../commons/b/b4/File.jpg 또는 .../commons/thumb/b/b4/File.jpg/330px-File.jpg
  const match = /\/(?:thumb\/)?[0-9a-f]\/[0-9a-f]{2}\/([^/]+)/.exec(path)
  return match ? `https://commons.wikimedia.org/wiki/File:${match[1]}` : undefined
}

/** 오픈스트리트맵의 wikipedia 태그("en:Tokyo Tower", "ja:東京タワー") → 위키 문서 언어와 제목 */
export function parseWikipediaTag(tag: string): { lang: string; title: string } | null {
  const match = /^([a-z]{2,3}(?:-[a-z]+)?):(.+)$/.exec(tag.trim())
  return match ? { lang: match[1], title: match[2] } : null
}

/** 장소 사진·설명용 요약. 어느 언어 문서든 사진은 쓰고, 설명은 화면에서 한국어·영어일 때만 보여준다. */
export function loadPlaceSummary(wikipediaTag: string): Promise<WikiSummary | null> {
  const parsed = parseWikipediaTag(wikipediaTag)
  if (!parsed) return Promise.resolve(null)
  return cached(`wiki:place:${wikipediaTag}`, () => fetchSummary(parsed.lang, parsed.title))
}
