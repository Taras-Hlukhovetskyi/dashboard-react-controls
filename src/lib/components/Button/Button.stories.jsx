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

import Button from './Button'

import {
  DANGER_BUTTON,
  LABEL_BUTTON,
  PRIMARY_BUTTON,
  SECONDARY_BUTTON,
  TERTIARY_BUTTON
} from '../../constants'

import EyeIcon from '../../images/eye-icon.svg?react'
import CaretIcon from '../../images/dropdown.svg?react'

export default {
  title: 'Example/Button',
  component: Button
}

const commonArgs = {
  disabled: false,
  tooltip: ''
}

const Template = args => <Button {...args} />

export const Primary = Template.bind({})
Primary.args = {
  ...commonArgs,
  label: 'Primary button',
  variant: PRIMARY_BUTTON
}

export const Secondary = Template.bind({})
Secondary.args = {
  ...commonArgs,
  label: 'Secondary button',
  variant: SECONDARY_BUTTON
}

export const Tertiary = Template.bind({})
Tertiary.args = {
  ...commonArgs,
  label: 'Tertiary button',
  variant: TERTIARY_BUTTON
}

export const Danger = Template.bind({})
Danger.args = {
  ...commonArgs,
  label: 'Danger button',
  variant: DANGER_BUTTON
}

export const Label = Template.bind({})
Label.args = {
  ...commonArgs,
  label: 'Label button',
  variant: LABEL_BUTTON
}

export const Icon = Template.bind({})
Icon.args = {
  ...commonArgs,
  label: '',
  icon: <CaretIcon />
}

export const IconWithLabel = Template.bind({})
IconWithLabel.args = {
  ...commonArgs,
  label: 'Awesome Button',
  icon: <EyeIcon />
}
