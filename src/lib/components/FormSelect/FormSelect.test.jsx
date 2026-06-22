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

import FormSelect from './FormSelect'
import { renderWithForm } from '../../../test/renderWithForm'

const OPTIONS = [
  { id: 'apple', label: 'Apple' },
  { id: 'banana', label: 'Banana' },
  { id: 'cherry', label: 'Cherry' }
]

const openMenu = async (user, name = 'fruit') => {
  await user.click(screen.getByTestId(`${name}-form-field-select`))
}

describe('FormSelect (parity contract)', () => {
  it('renders the label and the currently selected option', () => {
    renderWithForm(<FormSelect name="fruit" label="Fruit" options={OPTIONS} />, {
      initialValues: { fruit: 'banana' }
    })

    expect(screen.getByTestId('fruit-form-select-label')).toHaveTextContent('Fruit')
    expect(screen.getByTestId('selected-option')).toHaveTextContent('Banana')
  })

  it('shows the default placeholder text when nothing is selected', () => {
    renderWithForm(<FormSelect name="fruit" label="Fruit" options={OPTIONS} />)

    expect(screen.getByTestId('selected-option')).toHaveTextContent('Select Option')
  })

  it('opens the options menu on click and lists every option', async () => {
    const { user } = renderWithForm(
      <FormSelect name="fruit" label="Fruit" options={OPTIONS} />
    )

    expect(screen.queryByTestId('select-body')).not.toBeInTheDocument()

    await openMenu(user)

    const body = screen.getByTestId('select-body')
    expect(body).toBeInTheDocument()
    expect(within(body).getByText('Apple')).toBeInTheDocument()
    expect(within(body).getByText('Banana')).toBeInTheDocument()
    expect(within(body).getByText('Cherry')).toBeInTheDocument()
  })

  it('selects an option, updates the displayed value and fires onChange', async () => {
    const onChange = vi.fn()
    const { user } = renderWithForm(
      <FormSelect name="fruit" label="Fruit" options={OPTIONS} onChange={onChange} />
    )

    await openMenu(user)

    const body = screen.getByTestId('select-body')
    await user.click(within(body).getByText('Cherry'))

    expect(onChange).toHaveBeenCalledWith('cherry')

    await waitFor(() => {
      expect(screen.getByTestId('selected-option')).toHaveTextContent('Cherry')
    })
  })

  it('submits the selected option value', async () => {
    const onSubmit = vi.fn()
    const { user } = renderWithForm(
      <>
        <FormSelect name="fruit" label="Fruit" options={OPTIONS} />
        <button type="submit">submit</button>
      </>,
      { onSubmit }
    )

    await openMenu(user)
    await user.click(within(screen.getByTestId('select-body')).getByText('Apple'))

    await waitFor(() => {
      expect(screen.getByTestId('selected-option')).toHaveTextContent('Apple')
    })

    await user.click(screen.getByRole('button', { name: 'submit' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled()
    })
    expect(onSubmit.mock.calls[0][0]).toEqual({ fruit: 'apple' })
  })

  it('submits the initial value untouched', async () => {
    const onSubmit = vi.fn()
    const { user } = renderWithForm(
      <>
        <FormSelect name="fruit" label="Fruit" options={OPTIONS} />
        <button type="submit">submit</button>
      </>,
      { initialValues: { fruit: 'banana' }, onSubmit }
    )

    await user.click(screen.getByRole('button', { name: 'submit' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled()
    })
    expect(onSubmit.mock.calls[0][0]).toEqual({ fruit: 'banana' })
  })

  it('does not open the menu when disabled', async () => {
    const { user } = renderWithForm(
      <FormSelect name="fruit" label="Fruit" options={OPTIONS} disabled />
    )

    expect(screen.getByTestId('select-header')).toHaveClass('form-field__wrapper-disabled')

    await openMenu(user)

    expect(screen.queryByTestId('select-body')).not.toBeInTheDocument()
  })

  it('marks the active state with a CSS class while the menu is open', async () => {
    const { user } = renderWithForm(
      <FormSelect name="fruit" label="Fruit" options={OPTIONS} />
    )

    expect(screen.getByTestId('select-header')).not.toHaveClass('form-field__wrapper-active')

    await openMenu(user)

    expect(screen.getByTestId('select-header')).toHaveClass('form-field__wrapper-active')
  })

  it('shows a mandatory asterisk for a required, empty field', () => {
    renderWithForm(<FormSelect name="fruit" label="Fruit" options={OPTIONS} required />)

    expect(screen.getByTestId('fruit-form-select-label')).toHaveTextContent('*')
  })

  it('does not show a mandatory asterisk for a non-required field', () => {
    renderWithForm(<FormSelect name="fruit" label="Fruit" options={OPTIONS} />)

    expect(screen.getByTestId('fruit-form-select-label')).not.toHaveTextContent('*')
  })

  it('filters options through the search box', async () => {
    const { user } = renderWithForm(
      <FormSelect name="fruit" label="Fruit" options={OPTIONS} search />
    )

    await openMenu(user)

    const body = screen.getByTestId('select-body')
    const searchInput = screen.getByPlaceholderText('Search...')

    await user.type(searchInput, 'ban')

    await waitFor(() => {
      expect(within(body).getByText('Banana')).toBeInTheDocument()
      expect(within(body).queryByText('Apple')).not.toBeInTheDocument()
      expect(within(body).queryByText('Cherry')).not.toBeInTheDocument()
    })
  })
})
