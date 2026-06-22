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

import FormCombobox from './FormCombobox'
import { renderWithForm } from '../../../test/renderWithForm'

const SELECT_OPTIONS = [
  { id: 'v1', label: 'Version 1', className: '' },
  { id: 'v2', label: 'Version 2', className: '' }
]

const SUGGESTIONS = [
  { id: 'aaa', label: 'AAA' },
  { id: 'bbb', label: 'BBB' }
]

const openSelectDropdown = async (user, name = 'version') => {
  const combo = screen.getByTestId(`${name}-form-combobox`)
  await user.click(combo.querySelector('.form-field-combobox__select-header'))
}

describe('FormCombobox (parity contract)', () => {
  it('renders the label', () => {
    renderWithForm(
      <FormCombobox name="version" label="Version" selectOptions={SELECT_OPTIONS} />
    )

    expect(screen.getByTestId('label')).toHaveTextContent('Version')
  })

  it('shows a mandatory asterisk when required', () => {
    renderWithForm(
      <FormCombobox name="version" label="Version" selectOptions={SELECT_OPTIONS} required />
    )

    expect(screen.getByTestId('label')).toHaveTextContent('*')
  })

  it('does not show a mandatory asterisk when not required', () => {
    renderWithForm(
      <FormCombobox name="version" label="Version" selectOptions={SELECT_OPTIONS} />
    )

    expect(screen.getByTestId('label')).not.toHaveTextContent('*')
  })

  it('renders the provided input default value', () => {
    renderWithForm(
      <FormCombobox
        name="version"
        label="Version"
        selectOptions={SELECT_OPTIONS}
        inputDefaultValue="hello"
      />
    )

    expect(screen.getByTestId('version-form-combobox-input')).toHaveValue('hello')
  })

  it('renders the select placeholder when no select value is chosen', () => {
    renderWithForm(
      <FormCombobox
        name="version"
        label="Version"
        selectOptions={SELECT_OPTIONS}
        selectPlaceholder="Pick a version"
      />
    )

    expect(screen.getByText('Pick a version')).toBeInTheDocument()
  })

  it('opens the select dropdown and lists the select options', async () => {
    const { user } = renderWithForm(
      <FormCombobox name="version" label="Version" selectOptions={SELECT_OPTIONS} />
    )

    await openSelectDropdown(user)

    expect(screen.getByText('Version 1')).toBeInTheDocument()
    expect(screen.getByText('Version 2')).toBeInTheDocument()
  })

  it('selects a select option, reflects it in the header and fires onChange', async () => {
    const onChange = vi.fn()
    const { user } = renderWithForm(
      <FormCombobox
        name="version"
        label="Version"
        selectOptions={SELECT_OPTIONS}
        onChange={onChange}
      />
    )

    await openSelectDropdown(user)
    await user.click(screen.getByText('Version 2'))

    expect(onChange).toHaveBeenCalledWith('v2')

    const combo = screen.getByTestId('version-form-combobox')
    await waitFor(() => {
      expect(combo.querySelector('.form-field-combobox__select-header')).toHaveTextContent('v2')
    })
  })

  it('submits the chosen select option value', async () => {
    const onSubmit = vi.fn()
    const { user } = renderWithForm(
      <>
        <FormCombobox name="version" label="Version" selectOptions={SELECT_OPTIONS} />
        <button type="submit">submit</button>
      </>,
      { onSubmit }
    )

    await openSelectDropdown(user)
    await user.click(screen.getByText('Version 1'))

    await user.click(screen.getByRole('button', { name: 'submit' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled()
    })
    expect(onSubmit.mock.calls[0][0]).toEqual({ version: 'v1' })
  })

  it('fires onChange while typing free text into the input', async () => {
    const onChange = vi.fn()
    const { user } = renderWithForm(
      <FormCombobox
        name="version"
        label="Version"
        selectOptions={SELECT_OPTIONS}
        onChange={onChange}
      />
    )

    const input = screen.getByTestId('version-form-combobox-input')
    await user.type(input, 'abc')

    expect(input).toHaveValue('abc')
    expect(onChange).toHaveBeenLastCalledWith('', 'abc')
  })

  it('submits the typed free-text value', async () => {
    const onSubmit = vi.fn()
    const { user } = renderWithForm(
      <>
        <FormCombobox name="version" label="Version" selectOptions={SELECT_OPTIONS} />
        <button type="submit">submit</button>
      </>,
      { onSubmit }
    )

    await user.type(screen.getByTestId('version-form-combobox-input'), 'abc')
    await user.click(screen.getByRole('button', { name: 'submit' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled()
    })
    expect(onSubmit.mock.calls[0][0]).toEqual({ version: 'abc' })
  })

  it('combines the select prefix with typed text in the submitted value', async () => {
    const onSubmit = vi.fn()
    const { user } = renderWithForm(
      <>
        <FormCombobox name="version" label="Version" selectOptions={SELECT_OPTIONS} />
        <button type="submit">submit</button>
      </>,
      { onSubmit }
    )

    await openSelectDropdown(user)
    await user.click(screen.getByText('Version 1'))

    await user.type(screen.getByTestId('version-form-combobox-input'), 'abc')
    await user.click(screen.getByRole('button', { name: 'submit' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled()
    })
    expect(onSubmit.mock.calls[0][0]).toEqual({ version: 'v1abc' })
  })

  it('shows the suggestion list on focus and fills the input when a suggestion is clicked', async () => {
    const onChange = vi.fn()
    const { user } = renderWithForm(
      <FormCombobox
        name="version"
        label="Version"
        selectOptions={SELECT_OPTIONS}
        suggestionList={SUGGESTIONS}
        onChange={onChange}
      />
    )

    const input = screen.getByTestId('version-form-combobox-input')
    await user.click(input)

    await waitFor(() => {
      expect(screen.getByText('AAA')).toBeInTheDocument()
      expect(screen.getByText('BBB')).toBeInTheDocument()
    })

    await user.click(screen.getByText('AAA'))

    expect(input).toHaveValue('aaa')
    expect(onChange).toHaveBeenLastCalledWith('', 'aaa')
  })

  it('filters the suggestion list through the search box', async () => {
    const { user } = renderWithForm(
      <FormCombobox
        name="version"
        label="Version"
        selectOptions={SELECT_OPTIONS}
        suggestionList={SUGGESTIONS}
      />
    )

    await user.click(screen.getByTestId('version-form-combobox-input'))

    const searchInput = await screen.findByTestId('version-form-combobox-search')
    await user.type(searchInput, 'bb')

    await waitFor(() => {
      expect(screen.getByText('BBB')).toBeInTheDocument()
      expect(screen.queryByText('AAA')).not.toBeInTheDocument()
    })
  })

  it('marks the field invalid and reveals failing validation rules', async () => {
    const rules = [
      { name: 'lowercaseOnly', label: 'Lowercase letters only', pattern: /^[a-z]*$/ }
    ]
    const { user } = renderWithForm(
      <FormCombobox name="version" label="Version" selectOptions={SELECT_OPTIONS} rules={rules} />
    )

    const combo = screen.getByTestId('version-form-combobox')
    await user.type(screen.getByTestId('version-form-combobox-input'), 'ABC')

    await waitFor(() => {
      expect(combo).toHaveClass('form-field-combobox_invalid')
    })

    const warningButton = combo.querySelector('.form-field__warning')
    expect(warningButton).toBeInTheDocument()

    await user.click(warningButton)

    await waitFor(() => {
      expect(screen.getByText('Lowercase letters only')).toBeInTheDocument()
    })
  })

  it('adds the disabled wrapper class when disabled', () => {
    const { container } = renderWithForm(
      <FormCombobox name="version" label="Version" selectOptions={SELECT_OPTIONS} disabled />
    )

    const combo = screen.getByTestId('version-form-combobox')
    expect(combo.querySelector('.form-field__wrapper-disabled')).toBeInTheDocument()
    expect(container.querySelector('.form-field__label-disabled')).toBeInTheDocument()

    // NOTE: the `disabled` prop only toggles styling classes; the text input
    // itself is NOT given a `disabled` attribute, so it remains editable. This
    // is the current behavior being locked in.
    expect(screen.getByTestId('version-form-combobox-input')).not.toBeDisabled()
  })
})
