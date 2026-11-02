import type { City } from '../../types'
import { APP_AGENT, cached, fetchJson, HttpError } from './http'

export interface WikiSummary {
  title: string
  extract: string
  imageUrl?: string
  pageUrl: string
  lang: string
}

interface RawSummary {
  type?: string
  title?: string
  extract?: string
  thumbnail?: { source?: string }
  originalimage?: { source?: string }
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
  return cached(`wiki:city:${city.id}`, async () => {
    const ko = await fetchSummary('ko', city.wikiTitle ?? city.name)
    if (ko?.imageUrl) return ko
    // 한국어 문서에 사진이 없으면(예: 나짱) 영어 문서의 사진을 빌려 쓴다
    const en = await fetchSummary('en', city.nameEn)
    return ko ? { ...ko, imageUrl: en?.imageUrl } : en
  })
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
