import { addMemo, dDayLabel, removeMemo } from '../lib/trips'
import type { Place } from '../lib/api/overpass'
import type { Trip } from '../types'
import { Checklist } from './Checklist'
import { CityInfo } from './CityInfo'
import { CityPhoto } from './CityPhoto'
import { Header } from './Header'
import { Memos } from './Memos'

interface Props {
  trip: Trip
  today: string
  onBack: () => void
  onUpdate: (trip: Trip) => void
  onDelete: () => void
  onOpenPlace: (place: Place) => void
}

/** 내 여행 화면: 준비 체크리스트·메모와 여행지 정보 (TODO 1-5, 1-6, 2-2~2-7) */
export function TripPage({ trip, today, onBack, onUpdate, onDelete, onOpenPlace }: Props) {
  return (
    <div>
      <Header title={`${trip.city.name} 여행`} onBack={onBack} />
      <CityPhoto city={trip.city} className="detail-photo short" />
      <div className="page">
        <h2 className="detail-title">
          {trip.city.name} <span className="badge">{dDayLabel(today, trip)}</span>
        </h2>
        <p className="muted">
          {trip.originName} 출발 · {trip.departDate} ~ {trip.returnDate} · {trip.travelers}명
        </p>

        <Checklist items={trip.checklist} onChange={(checklist) => onUpdate({ ...trip, checklist })} />
        <Memos
          memos={trip.memos}
          defaultDate={today < trip.departDate ? trip.departDate : today > trip.returnDate ? trip.returnDate : today}
          onAdd={(date, text) => onUpdate(addMemo(trip, date, text))}
          onRemove={(id) => onUpdate(removeMemo(trip, id))}
        />

        <h2 className="section-title section">여행지 정보</h2>
        <CityInfo
          city={trip.city}
          originIata={trip.originIata}
          departDate={trip.departDate}
          returnDate={trip.returnDate}
          travelers={trip.travelers}
          onOpenPlace={onOpenPlace}
        />

        <button
          type="button"
          className="danger"
          onClick={() => {
            if (confirm('이 여행을 삭제할까요? 체크리스트와 메모도 함께 지워집니다.')) onDelete()
          }}
        >
          여행 삭제
        </button>
      </div>
    </div>
  )
}
