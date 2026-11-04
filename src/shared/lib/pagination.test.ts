import { describe, expect, it } from 'vitest'
import { buildPageList, buildPageWindow } from './pagination'

describe('buildPageList', () => {
  it('shows every page when the range is short', () => {
    expect(buildPageList(2, 5)).toEqual([1, 2, 3, 4, 5])
  })

  it('anchors first/last and ellipsizes interior gaps', () => {
    expect(buildPageList(4, 10)).toEqual([1, 'gap', 3, 4, 5, 'gap', 10])
  })

  it('inserts a gap for every non-adjacent jump', () => {
    expect(buildPageList(2, 10)).toEqual([1, 2, 3, 'gap', 10])
    expect(buildPageList(9, 10)).toEqual([1, 'gap', 8, 9, 10])
  })

  it('never duplicates the anchor pages', () => {
    expect(buildPageList(1, 10)).toEqual([1, 2, 'gap', 10])
    expect(buildPageList(10, 10)).toEqual([1, 'gap', 9, 10])
  })
})

describe('buildPageWindow', () => {
  it('returns every page while they fit the four cells', () => {
    expect(buildPageWindow(1, 3)).toEqual([1, 2, 3])
  })

  it('slides the window around the active page', () => {
    expect(buildPageWindow(1, 22)).toEqual([1, 2, 3, 4])
    expect(buildPageWindow(5, 22)).toEqual([4, 5, 6, 7])
    expect(buildPageWindow(20, 22)).toEqual([19, 20, 21, 22])
  })

  it('clamps the window at both ends', () => {
    expect(buildPageWindow(22, 22)).toEqual([19, 20, 21, 22])
    expect(buildPageWindow(1, 1)).toEqual([1])
  })
})
