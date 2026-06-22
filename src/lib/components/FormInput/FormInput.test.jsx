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

import FormInput from './FormInput'
import { renderWithForm } from '../../../test/renderWithForm'

const REQUIRED_RULE = [{ name: 'required', label: 'This field is required', pattern: /.+/ }]

describe('FormInput (parity contract)', () => {
  describe('rendering', () => {
    it('renders the label and the input with the initial form value', () => {
      renderWithForm(<FormInput name="title" label="Title" />, {
        initialValues: { title: 'hello' }
      })

      expect(screen.getByTestId('title-form-label')).toHaveTextContent('Title')
      expect(screen.getByTestId('title-form-input')).toHaveValue('hello')
    })

    it('shows the mandatory asterisk when required', () => {
      const { container } = renderWithForm(<FormInput name="title" label="Title" required />, {
        initialValues: { title: '' }
      })

      expect(container.querySelector('.form-field__label-mandatory')).toBeInTheDocument()
    })

    it('does not show the mandatory asterisk when not required', () => {
      const { container } = renderWithForm(<FormInput name="title" label="Title" />, {
        initialValues: { title: '' }
      })

      expect(container.querySelector('.form-field__label-mandatory')).not.toBeInTheDocument()
    })

    it('renders the input as disabled when disabled', () => {
      renderWithForm(<FormInput name="title" label="Title" disabled />, {
        initialValues: { title: 'x' }
      })

      expect(screen.getByTestId('title-form-input')).toBeDisabled()
    })
  })

  describe('value editing', () => {
    it('updates the input value as the user types', async () => {
      const { user } = renderWithForm(<FormInput name="title" label="Title" />, {
        initialValues: { title: '' }
      })

      const input = screen.getByTestId('title-form-input')
      await user.type(input, 'abc')

      expect(input).toHaveValue('abc')
    })

    it('submits the typed text value', async () => {
      const onSubmit = vi.fn()
      const { user } = renderWithForm(
        <>
          <FormInput name="title" label="Title" />
          <button type="submit">submit</button>
        </>,
        { initialValues: { title: '' }, onSubmit }
      )

      await user.type(screen.getByTestId('title-form-input'), 'mlrun')
      await user.click(screen.getByRole('button', { name: 'submit' }))

      await waitFor(() => expect(onSubmit).toHaveBeenCalled())
      expect(onSubmit.mock.calls[0][0]).toMatchObject({ title: 'mlrun' })
    })

    it('parses number inputs to a numeric value on submit', async () => {
      const onSubmit = vi.fn()
      const { user } = renderWithForm(
        <>
          <FormInput name="replicas" label="Replicas" type="number" />
          <button type="submit">submit</button>
        </>,
        { initialValues: {}, onSubmit }
      )

      await user.type(screen.getByTestId('replicas-form-input'), '42')
      await user.click(screen.getByRole('button', { name: 'submit' }))

      await waitFor(() => expect(onSubmit).toHaveBeenCalled())
      expect(onSubmit.mock.calls[0][0].replicas).toBe(42)
    })

    it('calls the onBlur handler', async () => {
      const onBlur = vi.fn()
      const { user } = renderWithForm(
        <>
          <FormInput name="title" label="Title" onBlur={onBlur} />
          <button type="button">outside</button>
        </>,
        { initialValues: { title: '' } }
      )

      await user.click(screen.getByTestId('title-form-input'))
      await user.click(screen.getByRole('button', { name: 'outside' }))

      expect(onBlur).toHaveBeenCalled()
    })
  })

  describe('validation', () => {
    it('marks the field invalid when a custom validator fails after editing', async () => {
      const validator = value =>
        value === 'bad' ? { name: 'custom', label: 'Bad value' } : undefined

      const { user, container } = renderWithForm(
        <FormInput name="title" label="Title" validator={validator} />,
        { initialValues: { title: '' } }
      )

      await user.type(screen.getByTestId('title-form-input'), 'bad')

      await waitFor(() =>
        expect(container.querySelector('.form-field__wrapper-invalid')).toBeInTheDocument()
      )
    })

    it('keeps the field valid when the custom validator passes', async () => {
      const validator = value =>
        value === 'bad' ? { name: 'custom', label: 'Bad value' } : undefined

      const { user, container } = renderWithForm(
        <FormInput name="title" label="Title" validator={validator} />,
        { initialValues: { title: '' } }
      )

      await user.type(screen.getByTestId('title-form-input'), 'good')

      expect(container.querySelector('.form-field__wrapper-invalid')).not.toBeInTheDocument()
    })

    it('flags a required field as invalid after its value is cleared', async () => {
      const { user, container } = renderWithForm(
        <FormInput name="title" label="Title" required validationRules={REQUIRED_RULE} />,
        { initialValues: { title: 'preset' } }
      )

      await user.clear(screen.getByTestId('title-form-input'))

      await waitFor(() =>
        expect(container.querySelector('.form-field__wrapper-invalid')).toBeInTheDocument()
      )
    })

    it('invokes onValidationError when validity changes', async () => {
      const onValidationError = vi.fn()
      const validator = value =>
        value === 'bad' ? { name: 'custom', label: 'Bad value' } : undefined

      const { user } = renderWithForm(
        <FormInput
          name="title"
          label="Title"
          validator={validator}
          onValidationError={onValidationError}
        />,
        { initialValues: { title: '' } }
      )

      await user.type(screen.getByTestId('title-form-input'), 'bad')

      await waitFor(() => expect(onValidationError).toHaveBeenCalledWith(true))
    })
  })

  describe('suggestions', () => {
    it('shows the suggestion list on focus and selects a suggestion on click', async () => {
      const { user, container } = renderWithForm(
        <FormInput name="title" label="Title" suggestionList={['alpha', 'beta']} />,
        { initialValues: { title: '' } }
      )

      const input = screen.getByTestId('title-form-input')
      await user.click(input)

      const list = container.querySelector('.form-field__suggestion-list')
      expect(list).toBeInTheDocument()

      await user.click(screen.getByText('alpha'))

      expect(input).toHaveValue('alpha')
    })
  })
})
