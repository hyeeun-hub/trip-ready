import { cityGradient } from '../lib/cities'
import { addMemo, dDayLabel, removeMemo } from '../lib/trips'
import type { Trip } from '../types'
import { Checklist } from './Checklist'
import { Header } from './Header'
import { Memos } from './Memos'

interface Props {
  trip: Trip
  today: string
  onBack: () => void
  onUpdate: (trip: Trip) => void
  onDelete: () => void
}

/** 내 여행 화면: 준비 체크리스트와 메모 (TODO 1-5, 1-6). 2단계부터 여행지 정보·저장한 곳·예산이 더해진다. */
export function TripPage({ trip, today, onBack, onUpdate, onDelete }: Props) {
  return (
    <div>
      <Header title={`${trip.city.name} 여행`} onBack={onBack} />
      <div className="detail-photo short" style={{ background: cityGradient(trip.city.id) }}>
        <span className="city-photo-label">{trip.city.nameEn}</span>
      </div>
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
