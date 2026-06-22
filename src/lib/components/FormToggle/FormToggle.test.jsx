import React from 'react'
import { screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

import FormToggle from './FormToggle'
import { renderWithForm } from '../../../test/renderWithForm'

describe('FormToggle (parity contract)', () => {
  it('renders label and reflects initial checked value', () => {
    renderWithForm(<FormToggle name="enabled" label="Enable" />, {
      initialValues: { enabled: true }
    })

    expect(screen.getByText('Enable')).toBeInTheDocument()
    expect(screen.getByTestId('enabled-form-toggle')).toBeChecked()
  })

  it('toggles value and fires onChange', async () => {
    const onChange = vi.fn()
    const { user } = renderWithForm(
      <FormToggle name="enabled" label="Enable" onChange={onChange} />,
      { initialValues: { enabled: false } }
    )

    const toggle = screen.getByTestId('enabled-form-toggle')
    expect(toggle).not.toBeChecked()

    await user.click(toggle)

    expect(toggle).toBeChecked()
    expect(onChange).toHaveBeenCalled()
  })

  it('does not change when readOnly', async () => {
    const { user } = renderWithForm(<FormToggle name="enabled" readOnly />, {
      initialValues: { enabled: false }
    })

    const toggle = screen.getByTestId('enabled-form-toggle')
    expect(toggle).toBeDisabled()

    await user.click(toggle).catch(() => {})
    expect(toggle).not.toBeChecked()
  })
})
