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

import FormCheckBox from './FormCheckBox'
import { renderWithForm } from '../../../test/renderWithForm'

describe('FormCheckBox (parity contract)', () => {
  it('reflects the initial checked value', () => {
    renderWithForm(<FormCheckBox name="agree" label="I agree" />, {
      initialValues: { agree: true }
    })

    expect(screen.getByTestId('agree-form-checkbox')).toBeChecked()
  })

  it('reflects the initial unchecked value', () => {
    renderWithForm(<FormCheckBox name="agree" label="I agree" />, {
      initialValues: { agree: false }
    })

    expect(screen.getByTestId('agree-form-checkbox')).not.toBeChecked()
  })

  it('renders the label text', () => {
    renderWithForm(<FormCheckBox name="agree" label="I agree" />)

    expect(screen.getByText('I agree')).toBeInTheDocument()
  })

  it('renders children inside the label', () => {
    renderWithForm(
      <FormCheckBox name="agree" label="I agree">
        <span data-testid="checkbox-child">extra</span>
      </FormCheckBox>
    )

    expect(screen.getByTestId('checkbox-child')).toBeInTheDocument()
  })

  it('exposes a name based data-testid', () => {
    renderWithForm(<FormCheckBox name="agree" label="I agree" />)

    expect(screen.getByTestId('agree-form-checkbox')).toBeInTheDocument()
    expect(screen.getByTestId('form-field-checkbox')).toBeInTheDocument()
  })

  it('toggles checked state on click', async () => {
    const { user } = renderWithForm(<FormCheckBox name="agree" label="I agree" />, {
      initialValues: { agree: false }
    })

    const checkbox = screen.getByTestId('agree-form-checkbox')
    expect(checkbox).not.toBeChecked()

    await user.click(checkbox)

    expect(checkbox).toBeChecked()
  })

  it('reflects the checked state in the css class', async () => {
    const { user } = renderWithForm(<FormCheckBox name="agree" label="I agree" />, {
      initialValues: { agree: false }
    })

    const checkbox = screen.getByTestId('agree-form-checkbox')
    expect(checkbox).toHaveClass('unchecked')

    await user.click(checkbox)

    expect(checkbox).toHaveClass('checked')
  })

  it('mirrors the checked state in the value attribute as a string', async () => {
    const { user } = renderWithForm(<FormCheckBox name="agree" label="I agree" />, {
      initialValues: { agree: false }
    })

    const checkbox = screen.getByTestId('agree-form-checkbox')
    expect(checkbox).toHaveAttribute('value', 'false')

    await user.click(checkbox)

    expect(checkbox).toHaveAttribute('value', 'true')
  })

  it('submits the boolean value through the form', async () => {
    const onSubmit = vi.fn()
    const { user } = renderWithForm(
      <>
        <FormCheckBox name="agree" label="I agree" />
        <button type="submit">submit</button>
      </>,
      { initialValues: { agree: false }, onSubmit }
    )

    await user.click(screen.getByTestId('agree-form-checkbox'))
    await user.click(screen.getByRole('button', { name: 'submit' }))

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ agree: true }),
        expect.anything(),
        expect.anything()
      )
    )
  })

  it('applies the highlighted class to the label when highlightLabel is set', () => {
    renderWithForm(<FormCheckBox name="agree" label="I agree" highlightLabel />)

    expect(screen.getByText('I agree')).toHaveClass('highlighted')
  })

  it('applies the readonly modifier class on the wrapper', () => {
    renderWithForm(<FormCheckBox name="agree" label="I agree" readOnly />)

    expect(screen.getByTestId('form-field-checkbox')).toHaveClass('form-field-checkbox_readonly')
  })

  // NOTE: readOnly only adds a css class; it does not set the disabled attribute,
  // so the input remains enabled at the DOM level. This is the current behavior.
  it('does not disable the input when readOnly is set', () => {
    renderWithForm(<FormCheckBox name="agree" label="I agree" readOnly />)

    expect(screen.getByTestId('agree-form-checkbox')).not.toBeDisabled()
  })
})
