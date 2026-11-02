import { describe, expect, it } from 'vitest'
import { addItem, DEFAULT_CHECKLIST, defaultChecklist, progress, removeItem, toggleItem } from './checklist'

describe('준비 체크리스트 (1-5)', () => {
  it('기본 항목으로 시작하고 진행률은 0%', () => {
    const list = defaultChecklist()
    expect(list.map((i) => i.title)).toEqual(DEFAULT_CHECKLIST)
    expect(progress(list)).toBe(0)
  })

  it('체크하면 진행률이 바뀌고, 다시 누르면 풀린다', () => {
    const list = defaultChecklist()
    const one = toggleItem(list, list[0].id)
    expect(progress(one)).toBe(14) // 1/7
    expect(progress(toggleItem(one, list[0].id))).toBe(0)
    expect(progress(list.map((i) => ({ ...i, done: true })))).toBe(100)
  })

  it('직접 추가: 빈 이름·중복은 무시', () => {
    const list = defaultChecklist()
    const added = addItem(list, '  국제운전면허증 ', 'x')
    expect(added.at(-1)).toEqual({ id: 'x', title: '국제운전면허증', done: false, custom: true })
    expect(addItem(added, '국제운전면허증')).toBe(added)
    expect(addItem(added, '   ')).toBe(added)
  })

  it('직접 추가한 항목만 지울 수 있다', () => {
    const list = addItem(defaultChecklist(), '우산', 'x')
    expect(removeItem(list, 'x')).toHaveLength(7)
    expect(removeItem(list, 'default-0')).toHaveLength(8)
  })

  it('빈 목록의 진행률은 0%', () => {
    expect(progress([])).toBe(0)
  })
})
