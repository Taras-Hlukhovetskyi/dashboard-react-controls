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
import { describe, it, expect, vi, beforeAll } from 'vitest'

import FormKeyValueTable from './FormKeyValueTable'
import { renderWithForm } from '../../../test/renderWithForm'
import { setFieldState } from '../../utils/form.util'

// FormKeyValueTable receives the form api through its `formState` prop and uses
// the useFormTable hook, which relies on final-form-arrays mutators (push,
// remove, update) plus the custom `setFieldState` mutator. The harness wires
// arrayMutators; we only add `setFieldState`.
// jsdom does not implement scrollIntoView, which useFormTable calls (via a
// timeout) when adding a row. Stub it so the deferred call does not throw.
beforeAll(() => {
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {}
  }
})

const FIELDS_PATH = 'table'

const makeRow = (key, value) => ({ data: { key, value } })

const renderTable = (tableProps = {}, options = {}) => {
  const onSubmit = options.onSubmit || vi.fn()

  return {
    onSubmit,
    ...renderWithForm(
      formState => (
        <>
          <FormKeyValueTable fieldsPath={FIELDS_PATH} formState={formState} {...tableProps} />
          <button type="submit">submit</button>
        </>
      ),
      {
        initialValues: options.initialValues || { [FIELDS_PATH]: [] },
        onSubmit,
        mutators: { setFieldState }
      }
    )
  }
}

const clickRoundedIcon = async (user, testId) => {
  const button = within(screen.getByTestId(testId)).getByRole('button')
  await user.click(button)
}

describe('FormKeyValueTable (parity contract)', () => {
  it('renders the headers and the initial rows as text', () => {
    renderTable(
      {},
      { initialValues: { [FIELDS_PATH]: [makeRow('env', 'prod'), makeRow('team', 'core')] } }
    )

    const table = screen.getByTestId(FIELDS_PATH)

    expect(within(table).getByText('Key')).toBeInTheDocument()
    expect(within(table).getByText('Value')).toBeInTheDocument()
    expect(within(table).getByText('env')).toBeInTheDocument()
    expect(within(table).getByText('prod')).toBeInTheDocument()
    expect(within(table).getByText('team')).toBeInTheDocument()
    expect(within(table).getByText('core')).toBeInTheDocument()
  })

  it('exposes an add-row button keyed by the fields path', () => {
    renderTable()

    expect(screen.getByTestId(`${FIELDS_PATH}-add-btn`)).toBeInTheDocument()
  })

  it('adds a new row, applies it and includes it in the submitted values', async () => {
    const { user, onSubmit } = renderTable()

    await user.click(screen.getByTestId(`${FIELDS_PATH}-add-btn`))

    const keyInput = await screen.findByTestId(`${FIELDS_PATH}[0].data.key-form-input`)
    const valueInput = screen.getByTestId(`${FIELDS_PATH}[0].data.value-form-input`)

    await user.type(keyInput, 'env')
    await user.type(valueInput, 'prod')

    await clickRoundedIcon(user, 'apply-btn')

    await waitFor(() =>
      expect(screen.queryByTestId(`${FIELDS_PATH}[0].data.key-form-input`)).not.toBeInTheDocument()
    )

    // NOTE: The add-row and row-action (apply/delete) buttons render without an
    // explicit `type`, so each click also submits the surrounding form. We clear
    // the mock here and submit explicitly to assert on the final committed state.
    onSubmit.mockClear()
    await user.click(screen.getByText('submit'))

    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    expect(onSubmit.mock.calls[0][0][FIELDS_PATH]).toEqual([makeRow('env', 'prod')])
  })

  it('edits an existing row value and reflects it in the submitted values', async () => {
    const { user, onSubmit } = renderTable(
      {},
      { initialValues: { [FIELDS_PATH]: [makeRow('env', 'prod')] } }
    )

    await user.click(screen.getByText('prod'))

    const valueInput = await screen.findByTestId(`${FIELDS_PATH}[0].data.value-form-input`)
    await user.clear(valueInput)
    await user.type(valueInput, 'staging')

    await clickRoundedIcon(user, 'apply-btn')

    await waitFor(() =>
      expect(screen.queryByTestId(`${FIELDS_PATH}[0].data.value-form-input`)).not.toBeInTheDocument()
    )

    onSubmit.mockClear()
    await user.click(screen.getByText('submit'))

    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    expect(onSubmit.mock.calls[0][0][FIELDS_PATH]).toEqual([makeRow('env', 'staging')])
  })

  it('deletes a row and submits an empty array', async () => {
    const { user, onSubmit } = renderTable(
      {},
      { initialValues: { [FIELDS_PATH]: [makeRow('env', 'prod')] } }
    )

    expect(screen.getByText('env')).toBeInTheDocument()

    await clickRoundedIcon(user, 'delete-btn')

    await waitFor(() => expect(screen.queryByText('env')).not.toBeInTheDocument())

    onSubmit.mockClear()
    await user.click(screen.getByText('submit'))

    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    expect(onSubmit.mock.calls[0][0][FIELDS_PATH]).toEqual([])
  })

  it('marks a duplicate key as invalid via the field error state class', async () => {
    const { user } = renderTable(
      {},
      { initialValues: { [FIELDS_PATH]: [makeRow('dup', 'one')] } }
    )

    await user.click(screen.getByTestId(`${FIELDS_PATH}-add-btn`))

    const keyInput = await screen.findByTestId(`${FIELDS_PATH}[1].data.key-form-input`)
    await user.type(keyInput, 'dup')

    const keyField = screen.getByTestId(`${FIELDS_PATH}[1].data.key-form-field-input`)

    await waitFor(() =>
      expect(keyField.querySelector('.form-field__wrapper-invalid')).toBeInTheDocument()
    )
  })

  it('marks an empty required key as invalid when applying', async () => {
    const { user } = renderTable()

    await user.click(screen.getByTestId(`${FIELDS_PATH}-add-btn`))

    const valueInput = await screen.findByTestId(`${FIELDS_PATH}[0].data.value-form-input`)
    await user.type(valueInput, 'prod')

    // Apply with an empty (required) key keeps the row in edit mode and flags it.
    await clickRoundedIcon(user, 'apply-btn')

    const keyField = screen.getByTestId(`${FIELDS_PATH}[0].data.key-form-field-input`)

    await waitFor(() =>
      expect(keyField.querySelector('.form-field__wrapper-invalid')).toBeInTheDocument()
    )
  })
})
