import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach } from 'vitest'

// Several DRC components (Tooltip, PopUpDialog, OptionsMenu, ...) render through a
// React portal into `#overlay_container`, which the host app provides at runtime.
// Recreate it for every test so portal-based UI can mount under jsdom.
const OVERLAY_CONTAINER_ID = 'overlay_container'

beforeEach(() => {
  if (!document.getElementById(OVERLAY_CONTAINER_ID)) {
    const overlayContainer = document.createElement('div')
    overlayContainer.setAttribute('id', OVERLAY_CONTAINER_ID)
    document.body.appendChild(overlayContainer)
  }
})

afterEach(() => {
  cleanup()
  document.getElementById(OVERLAY_CONTAINER_ID)?.remove()
})

if (typeof global.ResizeObserver === 'undefined') {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false
  })
}
