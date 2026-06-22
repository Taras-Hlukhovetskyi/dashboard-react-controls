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
import { render, screen, within } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import ReadOnlyChips from './ReadOnlyChips'

// ReadOnlyChips builds its OWN final-form instance internally (via createForm),
// so it does not need the renderWithForm harness.
describe('ReadOnlyChips (parity contract)', () => {
  it('renders the chips provided through the labels prop', () => {
    render(
      <ReadOnlyChips
        labels={[
          { key: 'env', value: 'prod', id: 'env' },
          { key: 'team', value: 'core', id: 'team' }
        ]}
      />
    )

    expect(screen.getByDisplayValue('env')).toBeInTheDocument()
    expect(screen.getByDisplayValue('prod')).toBeInTheDocument()
    expect(screen.getByDisplayValue('team')).toBeInTheDocument()
    expect(screen.getByDisplayValue('core')).toBeInTheDocument()
  })

  it('renders the chips as read-only (disabled) inputs', () => {
    render(<ReadOnlyChips labels={[{ key: 'env', value: 'prod', id: 'env' }]} />)

    expect(screen.getByDisplayValue('env')).toBeDisabled()
    expect(screen.getByDisplayValue('prod')).toBeDisabled()
  })

  it('does not expose an add-chip control in read-only mode', () => {
    render(<ReadOnlyChips labels={[{ key: 'env', value: 'prod', id: 'env' }]} />)

    expect(screen.queryByTestId('labels-add-chip')).not.toBeInTheDocument()
  })

  it('renders no chip inputs when there are no labels', () => {
    render(<ReadOnlyChips labels={[]} />)

    expect(screen.queryByTestId('input')).not.toBeInTheDocument()
  })

  it('renders each chip under the chips container scoped by name', () => {
    render(<ReadOnlyChips labels={[{ key: 'env', value: 'prod', id: 'env' }]} />)

    const chipsContainer = screen.getByTestId('labels-chips')

    expect(within(chipsContainer).getByDisplayValue('env')).toBeInTheDocument()
    expect(within(chipsContainer).getByDisplayValue('prod')).toBeInTheDocument()
  })
})
