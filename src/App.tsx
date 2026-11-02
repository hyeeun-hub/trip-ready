import { useState } from 'react'
import { BackLink } from './components/BackLink'
import { CityPage } from './components/CityPage'
import { ExplorePage } from './components/ExplorePage'
import { HomePage } from './components/HomePage'
import { NavBar } from './components/NavBar'
import { NewTripPage } from './components/NewTripPage'
import { PlaceDetail } from './components/PlaceDetail'
import { TripPage } from './components/TripPage'
import { TripsPage } from './components/TripsPage'
import { findCity, findPlace } from './lib/cityRegistry'
import { todayISO } from './lib/date'
import { goToTrip } from './lib/navigation'
import { href, navigate, useRoute } from './lib/router'
import { loadTrips, saveTrips } from './lib/storage'
import { createTrip } from './lib/trips'
import type { NewTrip, Trip } from './types'
import './App.css'

function NotFound({ message }: { message: string }) {
  return (
    <div className="container narrow">
      <BackLink />
      <div className="card empty">
        <h3>{message}</h3>
        <p className="muted">
          <a href={href({ page: 'home' })}>홈으로</a> 돌아가 다시 골라 주세요.
        </p>
      </div>
    </div>
  )
}

function App() {
  const route = useRoute()
  const [trips, setTrips] = useState<Trip[]>(() => loadTrips())
  const [saveFailed, setSaveFailed] = useState(false)
  const today = todayISO()

  function updateTrips(next: Trip[]) {
    setTrips(next)
    setSaveFailed(!saveTrips(next))
  }

  function updateTrip(next: Trip) {
    updateTrips(trips.map((t) => (t.id === next.id ? next : t)))
  }

  function handleCreate(input: NewTrip) {
    const trip = createTrip(input)
    updateTrips([...trips, trip])
    goToTrip(trip)
  }

  function page() {
    switch (route.page) {
      case 'home':
        return <HomePage trips={trips} today={today} />
      case 'explore':
        return <ExplorePage key={route.query ?? ''} query={route.query} />
      case 'city': {
        const city = findCity(route.cityId, trips)
        return city ? <CityPage city={city} tab={route.tab} trips={trips} /> : <NotFound message="도시를 찾을 수 없어요." />
      }
      case 'new':
        return <NewTripPage key={route.cityId ?? ''} city={route.cityId ? findCity(route.cityId, trips) : undefined} onCreate={handleCreate} />
      case 'trips':
        return <TripsPage trips={trips} today={today} />
      case 'trip': {
        const trip = trips.find((t) => t.id === route.tripId)
        return trip ? (
          <TripPage
            trip={trip}
            tab={route.tab}
            today={today}
            onUpdate={updateTrip}
            onDelete={() => {
              updateTrips(trips.filter((t) => t.id !== trip.id))
              navigate({ page: 'trips' })
            }}
          />
        ) : (
          <NotFound message="여행을 찾을 수 없어요." />
        )
      }
      case 'place': {
        const city = findCity(route.cityId, trips)
        const place = findPlace(route.cityId, route.placeId, trips)
        return city && place ? (
          <PlaceDetail place={place} city={city} trips={trips} onUpdateTrip={updateTrip} />
        ) : (
          <NotFound message="장소 정보를 찾을 수 없어요." />
        )
      }
    }
  }

  return (
    <>
      <NavBar current={route} />
      {saveFailed && (
        <p className="save-warning" role="alert">
          이 브라우저에 저장할 수 없어서 새로고침하면 내용이 사라져요.
        </p>
      )}
      <main className="app">{page()}</main>
      <footer className="site-footer">
        사진: 위키백과·<a href="https://commons.wikimedia.org/" target="_blank" rel="noreferrer">위키미디어 공용</a> (각 사진 출처는 화면 위쪽 사진의 ⓒ 링크) · 지도·장소:{' '}
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap 기여자</a>
      </footer>
    </>
  )
}

export default App
