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
import { screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

import FormRadio from './FormRadio'
import { renderWithForm } from '../../../test/renderWithForm'

const renderGroup = (options = {}) =>
  renderWithForm(
    <>
      <FormRadio name="color" label="Red" value="red" />
      <FormRadio name="color" label="Blue" value="blue" />
      <button type="submit">submit</button>
    </>,
    options
  )

describe('FormRadio (parity contract)', () => {
  it('reflects the initial selected value', () => {
    renderGroup({ initialValues: { color: 'blue' } })

    expect(screen.getByTestId('color-blue-radio')).toBeChecked()
    expect(screen.getByTestId('color-red-radio')).not.toBeChecked()
  })

  it('renders the labels', () => {
    renderGroup()

    expect(screen.getByText('Red')).toBeInTheDocument()
    expect(screen.getByText('Blue')).toBeInTheDocument()
  })

  it('uses name + value based data-testid attributes', () => {
    renderGroup()

    expect(screen.getByTestId('color-red-form-radio')).toBeInTheDocument()
    expect(screen.getByTestId('color-red-radio')).toBeInTheDocument()
    expect(screen.getByTestId('color-blue-form-radio')).toBeInTheDocument()
    expect(screen.getByTestId('color-blue-radio')).toBeInTheDocument()
  })

  it('selects a radio on click and updates checked state', async () => {
    const { user } = renderGroup({ initialValues: { color: 'blue' } })

    await user.click(screen.getByTestId('color-red-radio'))

    expect(screen.getByTestId('color-red-radio')).toBeChecked()
    expect(screen.getByTestId('color-blue-radio')).not.toBeChecked()
  })

  it('applies the checked/unchecked css class based on selection', async () => {
    const { user } = renderGroup({ initialValues: { color: 'blue' } })

    expect(screen.getByTestId('color-blue-radio')).toHaveClass('checked')
    expect(screen.getByTestId('color-red-radio')).toHaveClass('unchecked')

    await user.click(screen.getByTestId('color-red-radio'))

    expect(screen.getByTestId('color-red-radio')).toHaveClass('checked')
    expect(screen.getByTestId('color-blue-radio')).toHaveClass('unchecked')
  })

  it('submits the selected value through the form', async () => {
    const onSubmit = vi.fn()
    const { user } = renderGroup({ initialValues: { color: 'blue' }, onSubmit })

    await user.click(screen.getByTestId('color-red-radio'))
    await user.click(screen.getByRole('button', { name: 'submit' }))

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ color: 'red' }),
        expect.anything(),
        expect.anything()
      )
    )
  })

  it('applies the readonly modifier class on the wrapper', () => {
    renderWithForm(<FormRadio name="color" label="Red" value="red" readOnly />)

    expect(screen.getByTestId('color-red-form-radio')).toHaveClass('form-field-radio_readonly')
  })

  // NOTE: readOnly only adds a css class; it does not set the disabled attribute,
  // so the input remains enabled at the DOM level. This is the current behavior.
  it('does not disable the input when readOnly is set', () => {
    renderWithForm(<FormRadio name="color" label="Red" value="red" readOnly />)

    expect(screen.getByTestId('color-red-radio')).not.toBeDisabled()
  })

  it('renders the label inside a tooltip wrapper when a tooltip is provided', () => {
    renderWithForm(<FormRadio name="color" label="Red" value="red" tooltip="Choose red" />)

    expect(screen.getByText('Red')).toBeInTheDocument()
    expect(screen.getByTestId('tooltip-wrapper')).toBeInTheDocument()
  })
})
