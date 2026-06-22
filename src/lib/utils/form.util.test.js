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
import { describe, it, expect } from 'vitest'

import {
  setFieldState,
  areFormValuesChanged,
  generateObjectFromKeyValue,
  parseObjectToKeyValue,
  isSubmitDisabled,
  clearArrayFromEmptyObjectElements
} from './form.util'

describe('form.util (characterization)', () => {
  describe('setFieldState', () => {
    it('mutates the matching field state with the provided values', () => {
      const field = { name: 'foo', modified: false }
      const state = { fields: { foo: field } }

      setFieldState(['foo', { modified: true }], state)

      expect(state.fields.foo.modified).toBe(true)
      // mutates the same object reference in place
      expect(state.fields.foo).toBe(field)
    })

    it('supports nested state paths via lodash set', () => {
      const state = { fields: { foo: { name: 'foo' } } }

      setFieldState(['foo', { 'meta.touched': true }], state)

      expect(state.fields.foo.meta.touched).toBe(true)
    })

    it('sets multiple state properties at once', () => {
      const state = { fields: { foo: { name: 'foo' } } }

      setFieldState(['foo', { modified: true, touched: true }], state)

      expect(state.fields.foo.modified).toBe(true)
      expect(state.fields.foo.touched).toBe(true)
    })

    it('does nothing when the field does not exist', () => {
      const state = { fields: {} }

      expect(() => setFieldState(['missing', { modified: true }], state)).not.toThrow()
      expect(state.fields.missing).toBeUndefined()
    })
  })

  describe('areFormValuesChanged', () => {
    it('returns false when values are deeply equal', () => {
      const values = { a: 1, b: 'text' }

      expect(areFormValuesChanged(values, { a: 1, b: 'text' })).toBe(false)
    })

    it('returns true when a primitive value differs', () => {
      expect(areFormValuesChanged({ a: 1 }, { a: 2 })).toBe(true)
    })

    it('treats empty string as undefined (no change reported)', () => {
      expect(areFormValuesChanged({ a: 'x' }, { a: 'x', b: '' })).toBe(false)
    })

    it('ignores empty object array elements when comparing', () => {
      const initialValues = { list: [{ data: { key: 'a', value: 'b' } }] }
      const values = {
        list: [{ data: { key: 'a', value: 'b' } }, { data: { key: '', value: '' } }]
      }

      expect(areFormValuesChanged(initialValues, values)).toBe(false)
    })

    it('reports a change when a non-empty array element is added', () => {
      const initialValues = { list: [{ data: { key: 'a', value: 'b' } }] }
      const values = {
        list: [{ data: { key: 'a', value: 'b' } }, { data: { key: 'c', value: 'd' } }]
      }

      expect(areFormValuesChanged(initialValues, values)).toBe(true)
    })
  })

  describe('generateObjectFromKeyValue', () => {
    it('builds an object keyed by data.key with data.value', () => {
      const list = [
        { data: { key: 'a', value: '1' } },
        { data: { key: 'b', value: '2' } }
      ]

      expect(generateObjectFromKeyValue(list)).toEqual({ a: '1', b: '2' })
    })

    it('returns an empty object when called with no arguments', () => {
      expect(generateObjectFromKeyValue()).toEqual({})
    })

    it('later duplicate keys overwrite earlier ones', () => {
      const list = [
        { data: { key: 'a', value: '1' } },
        { data: { key: 'a', value: '2' } }
      ]

      expect(generateObjectFromKeyValue(list)).toEqual({ a: '2' })
    })
  })

  describe('parseObjectToKeyValue', () => {
    it('converts an object into an array of { data: { key, value } }', () => {
      expect(parseObjectToKeyValue({ a: '1', b: '2' })).toEqual([
        { data: { key: 'a', value: '1' } },
        { data: { key: 'b', value: '2' } }
      ])
    })

    it('returns an empty array when called with no arguments', () => {
      expect(parseObjectToKeyValue()).toEqual([])
    })

    it('is the inverse of generateObjectFromKeyValue', () => {
      const object = { a: '1', b: '2' }

      expect(generateObjectFromKeyValue(parseObjectToKeyValue(object))).toEqual(object)
    })
  })

  describe('isSubmitDisabled', () => {
    it('returns true while submitting', () => {
      expect(isSubmitDisabled({ submitting: true, invalid: false, submitFailed: false })).toBe(true)
    })

    it('returns true when invalid and submit has failed', () => {
      expect(isSubmitDisabled({ submitting: false, invalid: true, submitFailed: true })).toBe(true)
    })

    it('returns false when invalid but submit has not failed yet', () => {
      expect(isSubmitDisabled({ submitting: false, invalid: true, submitFailed: false })).toBe(
        false
      )
    })

    it('returns false for a valid, idle form', () => {
      expect(isSubmitDisabled({ submitting: false, invalid: false, submitFailed: false })).toBe(
        false
      )
    })
  })

  describe('clearArrayFromEmptyObjectElements', () => {
    it('keeps elements that have at least one non-empty data value', () => {
      const arr = [
        { data: { key: 'a', value: 'b' } },
        { data: { key: '', value: '' } }
      ]

      expect(clearArrayFromEmptyObjectElements(arr)).toEqual([{ data: { key: 'a', value: 'b' } }])
    })

    it('keeps an element if only one of its data fields is filled', () => {
      const arr = [{ data: { key: 'a', value: '' } }]

      expect(clearArrayFromEmptyObjectElements(arr)).toEqual([{ data: { key: 'a', value: '' } }])
    })

    it('falls back to the element itself when there is no data property', () => {
      const arr = [{ key: 'a' }, { key: '' }]

      expect(clearArrayFromEmptyObjectElements(arr)).toEqual([{ key: 'a' }])
    })

    it('returns an empty array when called with no arguments', () => {
      expect(clearArrayFromEmptyObjectElements()).toEqual([])
    })

    it('removes elements whose only values are numbers (lodash isEmpty treats numbers as empty)', () => {
      // NOTE: characterizes current behavior - lodash.isEmpty(<number>) === true,
      // so a data object containing only a numeric value is considered empty.
      const arr = [{ data: { value: 5 } }]

      expect(clearArrayFromEmptyObjectElements(arr)).toEqual([])
    })
  })
})
