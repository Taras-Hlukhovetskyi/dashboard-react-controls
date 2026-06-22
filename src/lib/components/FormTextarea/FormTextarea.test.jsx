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

import FormTextarea from './FormTextarea'
import { renderWithForm } from '../../../test/renderWithForm'

describe('FormTextarea (parity contract)', () => {
  it('renders the initial value from the form', () => {
    renderWithForm(<FormTextarea name="description" label="Description" />, {
      initialValues: { description: 'hello world' }
    })

    expect(screen.getByTestId('textarea')).toHaveValue('hello world')
  })

  it('renders the label', () => {
    renderWithForm(<FormTextarea name="description" label="Description" />)

    const label = screen.getByTestId('label')
    expect(label).toBeInTheDocument()
    expect(label).toHaveTextContent('Description')
  })

  it('does not render a label when none is provided', () => {
    renderWithForm(<FormTextarea name="description" />)

    expect(screen.queryByTestId('label')).not.toBeInTheDocument()
  })

  it('renders a mandatory asterisk when required', () => {
    renderWithForm(<FormTextarea name="description" label="Description" required />)

    expect(screen.getByTestId('label')).toHaveTextContent('Description *')
  })

  it('updates value and fires onChange with the new string value', async () => {
    const onChange = vi.fn()
    const { user } = renderWithForm(
      <FormTextarea name="description" label="Description" onChange={onChange} />,
      { initialValues: { description: '' } }
    )

    const textarea = screen.getByTestId('textarea')
    await user.type(textarea, 'abc')

    expect(textarea).toHaveValue('abc')
    expect(onChange).toHaveBeenLastCalledWith('abc')
  })

  it('submits the typed value through the form', async () => {
    const onSubmit = vi.fn()
    const { user } = renderWithForm(
      <>
        <FormTextarea name="description" label="Description" />
        <button type="submit">submit</button>
      </>,
      { initialValues: { description: '' }, onSubmit }
    )

    await user.type(screen.getByTestId('textarea'), 'hello')
    await user.click(screen.getByRole('button', { name: 'submit' }))

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ description: 'hello' }),
        expect.anything(),
        expect.anything()
      )
    )
  })

  it('does not change value or fire onChange when disabled', async () => {
    const onChange = vi.fn()
    const { user } = renderWithForm(
      <FormTextarea name="description" label="Description" disabled onChange={onChange} />,
      { initialValues: { description: 'frozen' } }
    )

    const textarea = screen.getByTestId('textarea')
    expect(textarea).toBeDisabled()

    await user.type(textarea, 'more').catch(() => {})

    expect(textarea).toHaveValue('frozen')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('renders the character counter when maxLength is set', () => {
    renderWithForm(<FormTextarea name="description" label="Description" maxLength={10} />, {
      initialValues: { description: 'abc' }
    })

    expect(screen.getByText('7 characters left')).toBeInTheDocument()
  })

  it('uses the singular "character" wording when one character remains', () => {
    renderWithForm(<FormTextarea name="description" label="Description" maxLength={4} />, {
      initialValues: { description: 'abc' }
    })

    expect(screen.getByText('1 character left')).toBeInTheDocument()
  })

  it('renders a provided textarea icon', () => {
    renderWithForm(
      <FormTextarea name="description" label="Description" textAreaIcon={<span>icon</span>} />
    )

    expect(screen.getByTestId('textarea__icon')).toBeInTheDocument()
  })

  it('marks the field invalid when the value starts with a space', async () => {
    const { user } = renderWithForm(<FormTextarea name="description" label="Description" />, {
      initialValues: { description: '' }
    })

    const textarea = screen.getByTestId('textarea')
    await user.type(textarea, ' leading space')

    await waitFor(() =>
      expect(textarea.closest('.form-field__wrapper')).toHaveClass('form-field__wrapper-invalid')
    )
  })

  it('blocks submission when a required field is empty and allows it once filled', async () => {
    const onSubmit = vi.fn()
    const { user } = renderWithForm(
      <>
        <FormTextarea name="description" label="Description" required />
        <button type="submit">submit</button>
      </>,
      { initialValues: { description: '' }, onSubmit }
    )

    await user.click(screen.getByRole('button', { name: 'submit' }))
    await waitFor(() => expect(onSubmit).not.toHaveBeenCalled())

    await user.type(screen.getByTestId('textarea'), 'valid value')
    await user.click(screen.getByRole('button', { name: 'submit' }))

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ description: 'valid value' }),
        expect.anything(),
        expect.anything()
      )
    )
  })

  it('blocks submission when the value starts with a space', async () => {
    const onSubmit = vi.fn()
    const { user } = renderWithForm(
      <>
        <FormTextarea name="description" label="Description" />
        <button type="submit">submit</button>
      </>,
      { initialValues: { description: '' }, onSubmit }
    )

    await user.type(screen.getByTestId('textarea'), ' spaced')
    await user.click(screen.getByRole('button', { name: 'submit' }))

    await waitFor(() => expect(onSubmit).not.toHaveBeenCalled())
  })
})
