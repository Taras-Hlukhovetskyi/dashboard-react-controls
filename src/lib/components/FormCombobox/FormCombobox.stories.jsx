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

import FormCombobox from '/src/lib/components/FormCombobox/FormCombobox'

export default {
  title: 'Example/FormCombobox',
  component: FormCombobox
}

const commonArgs = {
  name: 'combobox',
  selectOptions: [
    {
      className: 'path-type-store',
      label: 'MLRun store',
      id: 'store://'
    },
    {
      className: 'path-type-v3io',
      label: 'V3IO',
      id: 'v3io:///'
    }
  ]
}

const Template = args => <Form onSubmit={() => null}>{() => <FormCombobox {...args} />}</Form>

export const Dense = Template.bind({})
Dense.args = {
  ...commonArgs,
  density: 'dense'
}

export const Normal = Template.bind({})
Normal.args = {
  ...commonArgs,
  density: 'normal'
}

export const Medium = Template.bind({})
Medium.args = {
  ...commonArgs,
  density: 'medium'
}

export const Chunky = Template.bind({})
Chunky.args = {
  ...commonArgs,
  density: 'chunky'
}

export const WithDefaultValue = Template.bind({})
WithDefaultValue.args = {
  ...commonArgs,
  selectDefaultValue: {
    className: 'path-type-store',
    label: 'MLRun store',
    id: 'store://'
  },
  inputDefaultValue: 'artifacts/default'
}

export const WithSuggestions = Template.bind({})
WithSuggestions.args = {
  ...commonArgs,
  suggestionList: [
    {
      label: 'Artifact',
      id: 'artifacts'
    },
    {
      label: 'Feature Vector',
      id: 'featureVector'
    }
  ]
}
