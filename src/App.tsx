import { useState } from 'react'
import { CityPage } from './components/CityPage'
import { Home } from './components/Home'
import { PlaceDetail } from './components/PlaceDetail'
import { TripPage } from './components/TripPage'
import { todayISO } from './lib/date'
import { loadTrips, saveTrips } from './lib/storage'
import type { Place } from './lib/api/overpass'
import { createTrip } from './lib/trips'
import type { City, NewTrip, Trip } from './types'
import './App.css'

type View =
  | { name: 'home' }
  | { name: 'city'; city: City }
  | { name: 'trip'; tripId: string }
  | { name: 'place'; place: Place; city: City; back: View }

function App() {
  const [trips, setTrips] = useState<Trip[]>(() => loadTrips())
  const [view, setView] = useState<View>({ name: 'home' })
  const [saveFailed, setSaveFailed] = useState(false)
  const today = todayISO()

  function updateTrips(next: Trip[]) {
    setTrips(next)
    setSaveFailed(!saveTrips(next))
  }

  function go(next: View) {
    setView(next)
    window.scrollTo(0, 0)
  }

  function handleCreate(input: NewTrip) {
    const trip = createTrip(input)
    updateTrips([...trips, trip])
    go({ name: 'trip', tripId: trip.id })
  }

  const trip = view.name === 'trip' ? trips.find((t) => t.id === view.tripId) : undefined

  return (
    <main className="app">
      {saveFailed && (
        <p className="save-warning" role="alert">
          이 브라우저에 저장할 수 없어서 새로고침하면 내용이 사라져요.
        </p>
      )}
      {view.name === 'place' ? (
        <PlaceDetail place={view.place} city={view.city} onBack={() => go(view.back)} />
      ) : view.name === 'city' ? (
        <CityPage
          city={view.city}
          onBack={() => go({ name: 'home' })}
          onCreate={handleCreate}
          onOpenPlace={(place) => go({ name: 'place', place, city: view.city, back: view })}
        />
      ) : trip ? (
        <TripPage
          trip={trip}
          today={today}
          onBack={() => go({ name: 'home' })}
          onOpenPlace={(place) => go({ name: 'place', place, city: trip.city, back: view })}
          onUpdate={(next) => updateTrips(trips.map((t) => (t.id === next.id ? next : t)))}
          onDelete={() => {
            updateTrips(trips.filter((t) => t.id !== trip.id))
            go({ name: 'home' })
          }}
        />
      ) : (
        <Home
          trips={trips}
          today={today}
          onSelectCity={(city) => go({ name: 'city', city })}
          onOpenTrip={(id) => go({ name: 'trip', tripId: id })}
        />
      )}
    </main>
  )
}

export default App
