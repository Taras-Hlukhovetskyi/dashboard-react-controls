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
import { describe, it, expect, vi } from 'vitest'

import FormOnChange from './FormOnChange'
import FormInput from '../FormInput/FormInput'
import { renderWithForm } from '../../../test/renderWithForm'

describe('FormOnChange (parity contract)', () => {
  it('does not call the handler on initial mount', () => {
    const handler = vi.fn()

    renderWithForm(
      <>
        <FormInput name="title" />
        <FormOnChange name="title" handler={handler} />
      </>,
      { initialValues: { title: 'initial' } }
    )

    expect(handler).not.toHaveBeenCalled()
  })

  it('calls the handler with the new and previous value when the watched field changes', async () => {
    const handler = vi.fn()

    const { user } = renderWithForm(
      <>
        <FormInput name="title" />
        <FormOnChange name="title" handler={handler} />
      </>,
      { initialValues: { title: '' } }
    )

    const input = screen.getByTestId('title-form-input')

    await user.type(input, 'a')

    await waitFor(() => expect(handler).toHaveBeenCalledWith('a', ''))
  })

  it('reports each intermediate value transition while typing', async () => {
    const handler = vi.fn()

    const { user } = renderWithForm(
      <>
        <FormInput name="title" />
        <FormOnChange name="title" handler={handler} />
      </>,
      { initialValues: { title: '' } }
    )

    const input = screen.getByTestId('title-form-input')

    await user.type(input, 'ab')

    await waitFor(() => expect(handler).toHaveBeenLastCalledWith('ab', 'a'))
    expect(handler).toHaveBeenCalledWith('a', '')
  })

  it('does not call the handler for an unrelated field change', async () => {
    const handler = vi.fn()

    const { user } = renderWithForm(
      <>
        <FormInput name="watched" />
        <FormInput name="other" />
        <FormOnChange name="watched" handler={handler} />
      </>,
      { initialValues: { watched: '', other: '' } }
    )

    await user.type(screen.getByTestId('other-form-input'), 'x')

    expect(handler).not.toHaveBeenCalled()
  })
})
