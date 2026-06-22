/*
Copyright 2019 Iguazio Systems Ltd.

Licensed under the Apache License, Version 2.0 (the "License") with
an addition restriction as set forth herein. You may not use this
file except in compliance with the License. You may obtain a copy of
the License at http://www.apache.org/licenses/LICENSE-2.0.

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. See the License for the specific language governing
permissions and limitations under the License.

In addition, you may not use the software for any purposes that are
illegal under applicable law, and the grant of the foregoing license
under the Apache 2.0 license is conditioned upon your compliance with
such restriction.
*/
import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

import { useDetails } from './useDetails.hook'
import commonDetailsReducer, {
  setChanges,
  setChangesCounter
} from '../reducers/commonDetailsReducer'

// NOTE: useDetails is heavily coupled to react-redux (store.commonDetailsStore),
// react-router (useParams/useLocation) and final-form (createForm). These tests
// exercise it through a real redux Provider + MemoryRouter integration.
//
// NOT COVERED here (documented gaps, exercised by higher-level app integration
// tests rather than this unit-style suite):
//   - applyChanges / leavePage: depend on caller-supplied async callbacks plus
//     the `blocker` object (from react-router useBlocker) and a setTimeout-based
//     callback flow.
//   - The window "click" listener + #refresh element flow (handleRefreshClick).
//   - The location-change effect that restarts the form + dispatches setEditMode
//     when navigating between detail pages.
//   - The DetailsContainer render-prop component (rendered by consumers).

const createStore = () => configureStore({ reducer: { commonDetailsStore: commonDetailsReducer } })

const makeWrapper =
  (store, initialEntries = ['/projects/p1/details/overview']) =>
  ({ children }) => (
    <Provider store={store}>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/projects/:projectName/details/:tab" element={children} />
        </Routes>
      </MemoryRouter>
    </Provider>
  )

const defaultProps = {
  applyDetailsChanges: vi.fn(() => Promise.resolve()),
  applyDetailsChangesCallback: vi.fn(),
  formInitialValues: {},
  isDetailsPopUp: false,
  isDetailsScreen: false,
  selectedItem: {}
}

const renderUseDetails = (propsOverrides = {}, { store = createStore() } = {}) => {
  const props = { ...defaultProps, ...propsOverrides }
  const view = renderHook(() => useDetails(props), { wrapper: makeWrapper(store) })

  return { ...view, store, props }
}

describe('useDetails (characterization)', () => {
  it('imports and renders without crashing, exposing the documented API', () => {
    const { result } = renderUseDetails()

    expect(typeof result.current.DetailsContainer).toBe('function')
    expect(typeof result.current.applyChanges).toBe('function')
    expect(typeof result.current.cancelChanges).toBe('function')
    expect(typeof result.current.doNotLeavePage).toBe('function')
    expect(typeof result.current.handleShowWarning).toBe('function')
    expect(typeof result.current.leavePage).toBe('function')
    expect(typeof result.current.shouldDetailsBlock).toBe('function')
    expect(result.current.detailsRef).toHaveProperty('current')
    expect(result.current.applyChangesRef).toHaveProperty('current')
  })

  it('creates a final-form instance seeded with formInitialValues', () => {
    const { result } = renderUseDetails({ formInitialValues: { name: 'demo' } })

    const form = result.current.formRef.current

    expect(typeof form.getState).toBe('function')
    expect(form.getState().values).toEqual({ name: 'demo' })
  })

  it('exposes route params from react-router', () => {
    const { result } = renderUseDetails()

    expect(result.current.params).toMatchObject({ projectName: 'p1', tab: 'overview' })
  })

  it('reflects the initial commonDetailsStore state', () => {
    const { result } = renderUseDetails()

    expect(result.current.commonDetailsStore.changes.counter).toBe(0)
    expect(result.current.commonDetailsStore.showWarning).toBe(false)
  })

  it('builds detailsPanelClassNames from the store + flags', () => {
    const { result } = renderUseDetails({ isDetailsScreen: true })

    expect(result.current.detailsPanelClassNames).toContain('table__item')
    expect(result.current.detailsPanelClassNames).toContain('table__item_big')
  })

  it('handleShowWarning dispatches showWarning into the store', () => {
    const { result, store } = renderUseDetails()

    act(() => {
      result.current.handleShowWarning(true)
    })

    expect(store.getState().commonDetailsStore.showWarning).toBe(true)
    expect(result.current.commonDetailsStore.showWarning).toBe(true)
  })

  it('doNotLeavePage clears the warning flag', () => {
    const { result, store } = renderUseDetails()

    act(() => {
      result.current.handleShowWarning(true)
    })
    expect(store.getState().commonDetailsStore.showWarning).toBe(true)

    act(() => {
      result.current.doNotLeavePage()
    })

    expect(store.getState().commonDetailsStore.showWarning).toBe(false)
  })

  describe('shouldDetailsBlock', () => {
    it('returns false when there are no pending changes', () => {
      const { result } = renderUseDetails()

      const blocked = result.current.shouldDetailsBlock({
        currentLocation: { pathname: '/projects/p1/overview', search: '' },
        nextLocation: { pathname: '/projects/p2/overview', search: '' }
      })

      expect(blocked).toBe(false)
    })

    it('returns true when there are changes and the base path differs', () => {
      const { result, store } = renderUseDetails()

      act(() => {
        store.dispatch(setChangesCounter(1))
      })

      const blocked = result.current.shouldDetailsBlock({
        currentLocation: { pathname: '/projects/p1/overview', search: '' },
        nextLocation: { pathname: '/projects/p2/overview', search: '' }
      })

      expect(blocked).toBe(true)
    })

    it('returns false when there are changes but the location is unchanged', () => {
      const { result, store } = renderUseDetails()

      act(() => {
        store.dispatch(setChangesCounter(1))
      })

      const blocked = result.current.shouldDetailsBlock({
        currentLocation: { pathname: '/projects/p1/overview', search: '' },
        nextLocation: { pathname: '/projects/p1/overview', search: '' }
      })

      expect(blocked).toBe(false)
    })
  })

  describe('cancelChanges', () => {
    it('resets the store changes when the counter is greater than zero', () => {
      const { result, store } = renderUseDetails()

      act(() => {
        store.dispatch(setChanges({ counter: 2, data: { a: 1 } }))
      })
      expect(store.getState().commonDetailsStore.changes.counter).toBe(2)

      act(() => {
        result.current.cancelChanges()
      })

      expect(store.getState().commonDetailsStore.changes.counter).toBe(0)
      expect(store.getState().commonDetailsStore.changes.data).toEqual({})
    })

    it('is a no-op when there are no pending changes', () => {
      const { result, store } = renderUseDetails()

      act(() => {
        result.current.cancelChanges()
      })

      expect(store.getState().commonDetailsStore.changes.counter).toBe(0)
    })
  })

  it('dispatches resetChanges on unmount when not a details pop-up', () => {
    const { store, unmount } = renderUseDetails()

    act(() => {
      store.dispatch(setChangesCounter(3))
    })
    expect(store.getState().commonDetailsStore.changes.counter).toBe(3)

    act(() => {
      unmount()
    })

    expect(store.getState().commonDetailsStore.changes.counter).toBe(0)
  })
})
