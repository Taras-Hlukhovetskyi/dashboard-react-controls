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

import Tooltip from '/src/lib/components/Tooltip/Tooltip'
import TextTooltipTemplate from '/src/lib/components/TooltipTemplate/TextTooltipTemplate'
import EyeIcon from '../../images/eye-icon.svg?react'

export default {
  title: 'Example/Tooltip',
  component: Tooltip
}

const commonArgs = {
  template: <TextTooltipTemplate text="Tooltip" />,
  textShow: true
}

const Template = args => <Tooltip {...args} />

export const Normal = Template.bind({})
Normal.args = {
  ...commonArgs,
  children: 'Tooltip'
}

export const Icon = Template.bind({})
Icon.args = {
  ...commonArgs,
  children: <EyeIcon />
}
