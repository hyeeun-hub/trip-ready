import { formatWon, summarize } from '../lib/budget'
import { progress } from '../lib/checklist'
import { openPlace } from '../lib/navigation'
import { href, type TripTab } from '../lib/router'
import { toPoints } from '../lib/mapPoints'
import { savedPlaces } from '../lib/saved'
import { journalOf } from '../lib/journal'
import { dDayLabel } from '../lib/trips'
import type { Trip } from '../types'
import { BackLink } from './BackLink'
import { BudgetTab } from './BudgetTab'
import { Checklist } from './Checklist'
import { CityIntro, CityPlaces } from './CityInfo'
import { CityPhoto } from './CityPhoto'
import { JournalTab } from './JournalTab'
import { PlaceMap } from './PlaceMap'
import { SavedPlaces } from './SavedPlaces'
import { Tabs } from './Tabs'

interface Props {
  trip: Trip
  tab: TripTab
  today: string
  onUpdate: (trip: Trip) => void
  onDelete: () => void
}

/** 내 여행: 탭(한눈에 / 가고 싶은 곳 / 예산 / 준비물 / 여행 기록 / 둘러보기) */
export function TripPage({ trip, tab, today, onUpdate, onDelete }: Props) {
  const saved = savedPlaces(trip)
  const money = summarize(trip)
  const route = (t: TripTab) => ({ page: 'trip' as const, tripId: trip.id, tab: t })

  return (
    <div className="container">
      <BackLink label="내 여행" />
      <div className="city-hero short">
        <CityPhoto city={trip.city} className="city-hero-photo" width={1280} credit />
        <div className="city-hero-text">
          <h1>
            {trip.city.name} 여행 <span className="badge light">{dDayLabel(today, trip)}</span>
          </h1>
          <p>
            {trip.originName} 출발 · {trip.departDate} ~ {trip.returnDate} · {trip.travelers}명
          </p>
        </div>
      </div>

      <Tabs
        current={tab}
        tabs={[
          { value: 'overview', label: '한눈에', route: route('overview') },
          { value: 'saved', label: `가고 싶은 곳 ${saved.length}`, route: route('saved') },
          { value: 'budget', label: '예산', route: route('budget') },
          { value: 'prep', label: '준비물', route: route('prep') },
          { value: 'journal', label: '여행 기록', route: route('journal') },
          { value: 'explore', label: '둘러보기', route: route('explore') },
        ]}
      />

      {tab === 'overview' && (
        <>
          <div className="summary-grid">
            <a className="summary-card" href={href(route('prep'))}>
              <span className="summary-label">준비물</span>
              <span className="summary-value">{progress(trip.checklist)}%</span>
              <span className="muted">
                {trip.checklist.filter((i) => i.done).length}/{trip.checklist.length} 완료
              </span>
            </a>
            <a className="summary-card" href={href(route('saved'))}>
              <span className="summary-label">가고 싶은 곳</span>
              <span className="summary-value">{saved.length}곳</span>
              <span className="muted">{saved.filter((s) => s.visitDate).length}곳 날짜 정함</span>
            </a>
            <a className={money.warnings.length > 0 ? 'summary-card warn' : 'summary-card'} href={href(route('budget'))}>
              <span className="summary-label">예산</span>
              <span className="summary-value">{money.usedPercent === null ? formatWon(money.spent) : `${money.usedPercent}%`}</span>
              <span className="muted">{money.total > 0 ? `남은 돈 ${formatWon(money.remaining)}` : '총예산 미정'}</span>
            </a>
            <a className="summary-card" href={href(route('journal'))}>
              <span className="summary-label">여행 기록</span>
              <span className="summary-value">{journalOf(trip).length}개</span>
              <span className="muted">
                사진 {journalOf(trip).filter((e) => e.photoId).length}장 · {journalOf(trip).at(-1)?.caption || '아직 없어요'}
              </span>
            </a>
          </div>
          <CityIntro city={trip.city} originIata={trip.originIata} departDate={trip.departDate} returnDate={trip.returnDate} travelers={trip.travelers} />
          <div className="link-row">
            <a className="link-button" href={href({ page: 'city', cityId: trip.city.id, tab: 'about' })}>
              {trip.city.name} 도시 정보 보기
            </a>
          </div>
          <button
            type="button"
            className="danger"
            onClick={() => {
              if (confirm('이 여행을 삭제할까요? 체크리스트·여행 기록(사진 포함)·저장한 곳도 함께 지워집니다.')) onDelete()
            }}
          >
            여행 삭제
          </button>
        </>
      )}

      {tab === 'saved' && (
        <>
          {saved.length > 0 && (
            <section className="card map-card">
              <h3>저장한 곳 지도</h3>
              <PlaceMap
                center={trip.city}
                points={toPoints(
                  saved.map((s) => s.place),
                  new Set(saved.map((s) => s.place.id)),
                )}
                height={260}
                onSelect={(id) => {
                  const found = saved.find((s) => s.place.id === id)
                  if (found) openPlace(trip.city, found.place)
                }}
              />
            </section>
          )}
          <SavedPlaces trip={trip} onUpdate={onUpdate} onOpenPlace={(p) => openPlace(trip.city, p)} />
          {saved.length === 0 && (
            <div className="link-row">
              <a className="pill-button" href={href(route('explore'))}>
                둘러보기에서 장소 찾기
              </a>
            </div>
          )}
        </>
      )}

      {tab === 'budget' && <BudgetTab trip={trip} today={today} onUpdate={onUpdate} />}

      {tab === 'prep' && <Checklist items={trip.checklist} onChange={(checklist) => onUpdate({ ...trip, checklist })} />}

      {tab === 'journal' && <JournalTab trip={trip} today={today} onUpdate={onUpdate} />}

      {tab === 'explore' && (
        <CityPlaces city={trip.city} savedIds={new Set(saved.map((s) => s.place.id))} onOpenPlace={(p) => openPlace(trip.city, p)} />
      )}
    </div>
  )
}
