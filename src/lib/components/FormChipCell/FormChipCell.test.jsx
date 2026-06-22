/*
Copyright 2022 Iguazio Systems Ltd.
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
import { screen, waitFor, within } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

import FormChipCell from './FormChipCell'
import { renderWithForm } from '../../../test/renderWithForm'
import { setFieldState } from '../../utils/form.util'

// FormChipCell receives the form api through its `formState` prop and pushes/
// removes array items through final-form-arrays mutators plus the custom
// `setFieldState` mutator. The harness already wires arrayMutators; we only add
// `setFieldState`.
const renderChipCell = (chipCellProps = {}, options = {}) => {
  const onSubmit = options.onSubmit || vi.fn()

  return {
    onSubmit,
    ...renderWithForm(
      formState => (
        <>
          <FormChipCell
            name="chips"
            formState={formState}
            initialValues={formState.initialValues}
            {...chipCellProps}
          />
          <button type="submit">submit</button>
        </>
      ),
      {
        initialValues: options.initialValues || { chips: [] },
        onSubmit,
        mutators: { setFieldState }
      }
    )
  }
}

const makeChip = (key, value, id) => ({ key, value, id: id ?? `${key}-${value}` })

describe('FormChipCell (parity contract)', () => {
  it('renders the chips passed through initial values', () => {
    renderChipCell(
      { isEditable: true },
      { initialValues: { chips: [makeChip('env', 'prod', 1), makeChip('team', 'core', 2)] } }
    )

    expect(screen.getByDisplayValue('env')).toBeInTheDocument()
    expect(screen.getByDisplayValue('prod')).toBeInTheDocument()
    expect(screen.getByDisplayValue('team')).toBeInTheDocument()
    expect(screen.getByDisplayValue('core')).toBeInTheDocument()
  })

  it('exposes an add-chip button keyed by the field name when editable', () => {
    renderChipCell({ isEditable: true })

    expect(screen.getByTestId('chips-add-chip')).toBeInTheDocument()
  })

  it('adds a new chip and includes it in the submitted values', async () => {
    const { user, onSubmit } = renderChipCell({ isEditable: true })

    await user.click(screen.getByTestId('chips-add-chip'))

    const inputs = screen.getAllByTestId('input')
    await user.type(inputs[0], 'region')
    await user.type(inputs[1], 'eu')

    await user.click(screen.getByText('submit'))

    await waitFor(() => expect(onSubmit).toHaveBeenCalled())

    const submitted = onSubmit.mock.calls[0][0]
    expect(submitted.chips).toEqual([
      expect.objectContaining({ key: 'region', value: 'eu' })
    ])
  })

  it('edits an existing chip value and reflects it in the submitted values', async () => {
    const { user, onSubmit } = renderChipCell(
      { isEditable: true },
      { initialValues: { chips: [makeChip('env', 'prod', 1)] } }
    )

    const valueInput = screen.getByDisplayValue('prod')
    await user.clear(valueInput)
    await user.type(valueInput, 'staging')

    await user.click(screen.getByText('submit'))

    await waitFor(() => expect(onSubmit).toHaveBeenCalled())

    const submitted = onSubmit.mock.calls[0][0]
    expect(submitted.chips).toEqual([
      expect.objectContaining({ key: 'env', value: 'staging' })
    ])
  })

  it('removes a chip and submits an empty array', async () => {
    const { user, onSubmit, container } = renderChipCell(
      { isEditable: true, isDeletable: true },
      { initialValues: { chips: [makeChip('env', 'prod', 1)] } }
    )

    expect(screen.getByDisplayValue('env')).toBeInTheDocument()

    const removeButton = container.querySelector('button.item-icon-close')
    expect(removeButton).toBeTruthy()
    await user.click(removeButton)

    await waitFor(() => expect(screen.queryByDisplayValue('env')).not.toBeInTheDocument())

    await user.click(screen.getByText('submit'))

    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    expect(onSubmit.mock.calls[0][0].chips).toEqual([])
  })

  it('flags duplicate keys as invalid via the editable error state class', async () => {
    renderChipCell(
      { isEditable: true },
      {
        initialValues: {
          chips: [makeChip('dup', 'one', 1), makeChip('dup', 'two', 2)]
        }
      }
    )

    const duplicateKeyInputs = screen.getAllByDisplayValue('dup')
    expect(duplicateKeyInputs).toHaveLength(2)

    await waitFor(() => {
      duplicateKeyInputs.forEach(input => {
        expect(input.className).toContain('item_edited_invalid')
      })
    })
  })

  it('does not flag unique keys as invalid', () => {
    renderChipCell(
      { isEditable: true },
      {
        initialValues: {
          chips: [makeChip('env', 'prod', 1), makeChip('team', 'core', 2)]
        }
      }
    )

    expect(screen.getByDisplayValue('env').className).not.toContain('item_edited_invalid')
    expect(screen.getByDisplayValue('team').className).not.toContain('item_edited_invalid')
  })

  it('renders a label when provided', () => {
    renderChipCell(
      { isEditable: true, label: 'Labels' },
      { initialValues: { chips: [makeChip('env', 'prod', 1)] } }
    )

    const chipsContainer = screen.getByTestId('chips-chips')
    expect(within(chipsContainer).getByText('Labels')).toBeInTheDocument()
  })
})
