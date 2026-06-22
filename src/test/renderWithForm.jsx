/*
Test harness that renders DRC form components inside a form context.

The same test body can run against either form library by switching `lib`
(or the DRC_FORM_LIB env var). This is the parity contract: the behavioral
suite is written against RFF today and re-run against RHF after migration.
*/
import React from 'react'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Form } from 'react-final-form'
import arrayMutators from 'final-form-arrays'
import { FormProvider, useForm } from 'react-hook-form'

export const FORM_LIBS = {
  RFF: 'rff',
  RHF: 'rhf'
}

export const DEFAULT_FORM_LIB =
  process.env.DRC_FORM_LIB === FORM_LIBS.RHF ? FORM_LIBS.RHF : FORM_LIBS.RFF

const renderChildren = (children, api) =>
  typeof children === 'function' ? children(api) : children

const RffHarness = ({
  initialValues,
  onSubmit,
  mutators,
  formApiRef,
  formProps = {},
  children
}) => (
  <Form
    onSubmit={onSubmit}
    initialValues={initialValues}
    mutators={{ ...arrayMutators, ...mutators }}
    {...formProps}
  >
    {renderProps => {
      if (formApiRef) formApiRef.current = renderProps.form

      return (
        <form onSubmit={renderProps.handleSubmit} data-testid="test-form">
          {renderChildren(children, renderProps)}
        </form>
      )
    }}
  </Form>
)

const RhfHarness = ({ initialValues, onSubmit, mode, formApiRef, children }) => {
  const methods = useForm({
    defaultValues: initialValues,
    mode: mode || 'onChange',
    reValidateMode: 'onChange'
  })

  if (formApiRef) formApiRef.current = methods

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} data-testid="test-form">
        {renderChildren(children, methods)}
      </form>
    </FormProvider>
  )
}

/**
 * Render `ui` inside a form context.
 *
 * @param {React.ReactNode|Function} ui  Element or render-prop receiving the form api.
 * @param {object} options
 * @param {('rff'|'rhf')} [options.lib]   Form library to use. Defaults to DRC_FORM_LIB env or RFF.
 * @param {object} [options.initialValues]
 * @param {Function} [options.onSubmit]
 * @param {object} [options.mutators]     Extra RFF mutators (ignored by RHF).
 * @param {string} [options.mode]         RHF validation mode (ignored by RFF).
 * @param {object} [options.formApiRef]   Ref populated with the underlying form api.
 * @param {object} [options.formProps]    Extra props forwarded to the RFF <Form> (ignored by RHF).
 */
export function renderWithForm(
  ui,
  {
    lib = DEFAULT_FORM_LIB,
    initialValues = {},
    onSubmit = () => {},
    mutators,
    mode,
    formApiRef,
    formProps,
    ...renderOptions
  } = {}
) {
  const user = userEvent.setup()
  const Harness = lib === FORM_LIBS.RHF ? RhfHarness : RffHarness

  const utils = render(
    <Harness
      initialValues={initialValues}
      onSubmit={onSubmit}
      mutators={mutators}
      mode={mode}
      formApiRef={formApiRef}
      formProps={formProps}
    >
      {ui}
    </Harness>,
    renderOptions
  )

  return {
    user,
    lib,
    ...utils
  }
}
