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
import { screen, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Field } from 'react-final-form'
import { FieldArray } from 'react-final-form-arrays'

import { useFormTable } from './useFormTable.hook'
import { setFieldState } from '../utils/form.util'
import { renderWithForm } from '../../test/renderWithForm'

const FIELDS_PATH = 'table'

// Form-level validator that marks a row invalid when its `key` is empty.
// It produces the `errors.<fieldsPath>[index].data.key` shape the hook reads.
const requireKeyValidator = values => {
  const rows = values[FIELDS_PATH] || []
  const rowErrors = []

  rows.forEach((row, index) => {
    if (!row?.data?.key) {
      rowErrors[index] = { data: { key: 'Required' } }
    }
  })

  return rowErrors.length > 0 ? { [FIELDS_PATH]: rowErrors } : {}
}

const TableHost = ({ formState }) => {
  const {
    addNewRow,
    applyChanges,
    deleteRow,
    discardChanges,
    enterEditMode,
    editingItem,
    isCurrentRowEditing
  } = useFormTable(formState)

  return (
    <FieldArray name={FIELDS_PATH}>
      {({ fields }) => (
        <div>
          <div data-testid="editing-index">
            {editingItem ? String(editingItem.ui.index) : 'none'}
          </div>
          <div data-testid="editing-isnew">
            {editingItem ? String(Boolean(editingItem.ui.isNew)) : 'none'}
          </div>
          <div data-testid="row-count">{String(fields.length)}</div>
          <div data-testid="editing-row-0">
            {String(Boolean(isCurrentRowEditing(`${FIELDS_PATH}[0]`)))}
          </div>
          <button
            type="button"
            data-testid="add"
            onClick={event =>
              addNewRow(event, fields, FIELDS_PATH, { data: { key: '', value: '' } })
            }
          >
            Add
          </button>
          {fields.map((name, index) => (
            <div key={name} data-testid={`row-${index}`}>
              <Field name={`${name}.data.key`} component="input" data-testid={`key-${index}`} />
              <Field
                name={`${name}.data.value`}
                component="input"
                data-testid={`value-${index}`}
              />
              <button
                type="button"
                data-testid={`apply-${index}`}
                onClick={event => applyChanges(event, index)}
              >
                Apply
              </button>
              <button
                type="button"
                data-testid={`edit-${index}`}
                onClick={event => enterEditMode(event, fields, FIELDS_PATH, index)}
              >
                Edit
              </button>
              <button
                type="button"
                data-testid={`delete-${index}`}
                onClick={event => deleteRow(event, FIELDS_PATH, index)}
              >
                Delete
              </button>
              <button
                type="button"
                data-testid={`discard-${index}`}
                onClick={event => discardChanges(event, FIELDS_PATH, index)}
              >
                Discard
              </button>
            </div>
          ))}
        </div>
      )}
    </FieldArray>
  )
}

const renderTable = ({ initialValues = { [FIELDS_PATH]: [] }, validate } = {}) => {
  const formApiRef = React.createRef()

  const utils = renderWithForm(formState => <TableHost formState={formState} />, {
    initialValues,
    mutators: { setFieldState },
    formApiRef,
    formProps: validate ? { validate } : undefined
  })

  return { ...utils, formApiRef }
}

const getValues = formApiRef => formApiRef.current.getState().values

describe('useFormTable (characterization)', () => {
  describe('addNewRow', () => {
    it('pushes a new empty row and enters edit mode for it', async () => {
      const { user, formApiRef } = renderTable()

      await user.click(screen.getByTestId('add'))

      expect(screen.getByTestId('row-count')).toHaveTextContent('1')
      expect(screen.getByTestId('editing-index')).toHaveTextContent('0')
      expect(screen.getByTestId('editing-isnew')).toHaveTextContent('true')
      expect(screen.getByTestId('editing-row-0')).toHaveTextContent('true')
      expect(getValues(formApiRef)[FIELDS_PATH]).toHaveLength(1)
    })

    it('uses the previous length as the index of each newly added row', async () => {
      const { user } = renderTable()

      await user.click(screen.getByTestId('add'))
      expect(screen.getByTestId('editing-index')).toHaveTextContent('0')

      await user.click(screen.getByTestId('add'))
      expect(screen.getByTestId('row-count')).toHaveTextContent('2')
      expect(screen.getByTestId('editing-index')).toHaveTextContent('1')
    })
  })

  describe('applyChanges', () => {
    it('exits edit mode and keeps the row when there are no errors', async () => {
      const { user, formApiRef } = renderTable({ validate: requireKeyValidator })

      await user.click(screen.getByTestId('add'))
      await user.type(screen.getByTestId('key-0'), 'my-key')
      await user.type(screen.getByTestId('value-0'), 'my-value')

      await user.click(screen.getByTestId('apply-0'))

      expect(screen.getByTestId('editing-index')).toHaveTextContent('none')
      expect(screen.getByTestId('row-count')).toHaveTextContent('1')
      expect(getValues(formApiRef)[FIELDS_PATH][0].data).toEqual({
        key: 'my-key',
        value: 'my-value'
      })
    })

    it('stays in edit mode and keeps the row when the row is invalid', async () => {
      const { user, formApiRef } = renderTable({ validate: requireKeyValidator })

      await user.click(screen.getByTestId('add'))
      await user.click(screen.getByTestId('apply-0'))

      expect(screen.getByTestId('editing-index')).toHaveTextContent('0')
      expect(screen.getByTestId('row-count')).toHaveTextContent('1')
      expect(getValues(formApiRef)[FIELDS_PATH]).toHaveLength(1)
    })
  })

  describe('deleteRow', () => {
    it('removes the targeted row when several rows exist', async () => {
      const { user, formApiRef } = renderTable({
        initialValues: {
          [FIELDS_PATH]: [
            { data: { key: 'a', value: '1' } },
            { data: { key: 'b', value: '2' } }
          ]
        }
      })

      expect(screen.getByTestId('row-count')).toHaveTextContent('2')

      await user.click(screen.getByTestId('delete-0'))

      expect(screen.getByTestId('row-count')).toHaveTextContent('1')
      expect(getValues(formApiRef)[FIELDS_PATH]).toEqual([{ data: { key: 'b', value: '2' } }])
    })

    it('clears the array when deleting the last remaining row', async () => {
      const { user, formApiRef } = renderTable({
        initialValues: { [FIELDS_PATH]: [{ data: { key: 'a', value: '1' } }] }
      })

      await user.click(screen.getByTestId('delete-0'))

      expect(screen.getByTestId('row-count')).toHaveTextContent('0')
      expect(getValues(formApiRef)[FIELDS_PATH]).toEqual([])
    })
  })

  describe('enterEditMode', () => {
    it('enters edit mode for an existing row (not flagged as new)', async () => {
      const { user } = renderTable({
        initialValues: {
          [FIELDS_PATH]: [
            { data: { key: 'a', value: '1' } },
            { data: { key: 'b', value: '2' } }
          ]
        }
      })

      await user.click(screen.getByTestId('edit-1'))

      await waitFor(() => expect(screen.getByTestId('editing-index')).toHaveTextContent('1'))
      expect(screen.getByTestId('editing-isnew')).toHaveTextContent('false')
    })
  })

  describe('discardChanges', () => {
    it('restores the original row value and exits edit mode', async () => {
      const { user, formApiRef } = renderTable({
        initialValues: { [FIELDS_PATH]: [{ data: { key: 'a', value: '1' } }] }
      })

      await user.click(screen.getByTestId('edit-0'))
      await waitFor(() => expect(screen.getByTestId('editing-index')).toHaveTextContent('0'))

      await user.clear(screen.getByTestId('key-0'))
      await user.type(screen.getByTestId('key-0'), 'changed')
      expect(getValues(formApiRef)[FIELDS_PATH][0].data.key).toBe('changed')

      await user.click(screen.getByTestId('discard-0'))

      expect(screen.getByTestId('editing-index')).toHaveTextContent('none')
      expect(getValues(formApiRef)[FIELDS_PATH][0].data).toEqual({ key: 'a', value: '1' })
    })
  })
})
