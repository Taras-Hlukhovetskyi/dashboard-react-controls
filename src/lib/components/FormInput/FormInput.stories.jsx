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
import { Form } from 'react-final-form'

import FormInput from '/src/lib/components/FormInput/FormInput'
import { getValidationRules } from '/src/lib/utils/validation.util'
import { fn } from 'storybook/test'

export default {
  title: 'Example/FormInput',
  component: FormInput,
  args: {
    onValidationError: fn()
  }
}

const commonArgs = {
  name: 'input',
  placeholder: 'placeholder'
}
const Template = args => <Form onSubmit={() => null}>{() => <FormInput {...args} />}</Form>

export const Dense = Template.bind({})
Dense.args = {
  ...commonArgs,
  density: 'dense',
  label: 'Dense'
}

export const Normal = Template.bind({})
Normal.args = {
  ...commonArgs,
  density: 'normal',
  label: 'Normal'
}

export const Medium = Template.bind({})
Medium.args = {
  ...commonArgs,
  density: 'medium',
  label: 'Medium'
}

export const Chunky = Template.bind({})
Chunky.args = {
  ...commonArgs,
  density: 'chunky',
  label: 'Chunky'
}

export const WithTip = Template.bind({})
WithTip.args = {
  ...commonArgs,
  label: 'With Tip',
  tip: 'Tip'
}

export const WithValidationRules = Template.bind({})
WithValidationRules.args = {
  ...commonArgs,
  density: 'chunky',
  label: 'With validation rules',
  required: true,
  validationRules: getValidationRules('common.name')
}

export const WithLink = Template.bind({})
WithLink.args = {
  ...commonArgs,
  label: 'label with static link',
  link: {
    show: true,
    url: 'https:github.com'
  },
  value: 'test'
}

export const Range = Template.bind({})
Range.args = {
  ...commonArgs,
  label: 'Range input',
  placeholder: '',
  type: 'number',
  max: 10,
  min: 1
}
