import { openPlace } from '../lib/navigation'
import { href, type CityTab } from '../lib/router'
import { tripsForCity } from '../lib/saved'
import type { City, Trip } from '../types'
import { BackLink } from './BackLink'
import { CityIntro, OsmAttribution, PlaceList } from './CityInfo'
import { CityMap } from './CityMap'
import { CityPhoto } from './CityPhoto'
import { Tabs } from './Tabs'

interface Props {
  city: City
  tab: CityTab
  trips: Trip[]
}

/** 도시: 탭(소개·항공권 / 명소 / 식당·카페)과 여행 만들기 (TODO 1-3, 2-2~2-7) */
export function CityPage({ city, tab, trips }: Props) {
  const myTrips = tripsForCity(trips, city)
  return (
    <div className="container">
      <BackLink />
      <div className="city-hero">
        <CityPhoto city={city} className="city-hero-photo" />
        <div className="city-hero-text">
          <h1>{city.name}</h1>
          <p>{[city.country, city.nameEn].filter(Boolean).join(' · ')}</p>
        </div>
      </div>
      <div className="cta-row">
        <a className="pill-button" href={href({ page: 'new', cityId: city.id })}>
          이 도시로 여행 만들기
        </a>
        {myTrips.map((t) => (
          <a key={t.id} className="pill-button ghost" href={href({ page: 'trip', tripId: t.id, tab: 'overview' })}>
            내 여행 ({t.departDate})
          </a>
        ))}
      </div>

      <Tabs
        current={tab}
        tabs={[
          { value: 'about', label: '소개·항공권', route: { page: 'city', cityId: city.id, tab: 'about' } },
          { value: 'sights', label: '명소', route: { page: 'city', cityId: city.id, tab: 'sights' } },
          { value: 'food', label: '식당·카페', route: { page: 'city', cityId: city.id, tab: 'food' } },
          { value: 'map', label: '지도', route: { page: 'city', cityId: city.id, tab: 'map' } },
        ]}
      />

      {tab === 'about' ? (
        <CityIntro city={city} originIata="ICN" />
      ) : tab === 'map' ? (
        <CityMap city={city} onOpenPlace={(p) => openPlace(city, p)} />
      ) : (
        <>
          <PlaceList key={tab} city={city} kind={tab === 'sights' ? 'sights' : 'food'} onOpenPlace={(p) => openPlace(city, p)} />
          <OsmAttribution />
        </>
      )}
    </div>
  )
}
