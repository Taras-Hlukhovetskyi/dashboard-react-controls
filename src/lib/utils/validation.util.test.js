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
  required,
  checkPatternsValidity,
  checkPatternsValidityAsync,
  getValidationRules,
  getInternalLabelsValidationRule
} from './validation.util'

describe('validation.util (characterization)', () => {
  describe('required', () => {
    it('returns a validator that flags empty strings as invalid with the default message', () => {
      const validator = required()

      expect(validator('')).toEqual([false, 'Required'])
    })

    it('treats whitespace-only values as invalid', () => {
      expect(required()('   ')).toEqual([false, 'Required'])
    })

    it('returns valid for non-empty strings', () => {
      expect(required()('value')).toEqual([true, 'Required'])
    })

    it('uses the provided custom validation message', () => {
      expect(required('Field is mandatory')('')).toEqual([false, 'Field is mandatory'])
    })
  })

  describe('checkPatternsValidity', () => {
    it('marks each rule with isValid and returns overall validity (RegExp pattern)', () => {
      const rules = [{ name: 'startsWithA', pattern: /^a/ }]

      const [newRules, isValid] = checkPatternsValidity(rules, 'abc')

      expect(isValid).toBe(true)
      expect(newRules[0].isValid).toBe(true)
    })

    it('returns false overall when a RegExp rule fails', () => {
      const rules = [{ name: 'startsWithA', pattern: /^a/ }]

      const [newRules, isValid] = checkPatternsValidity(rules, 'xyz')

      expect(isValid).toBe(false)
      expect(newRules[0].isValid).toBe(false)
    })

    it('supports function patterns', () => {
      const rules = [{ name: 'shortEnough', pattern: value => value.length < 5 }]

      expect(checkPatternsValidity(rules, 'abcd')[1]).toBe(true)
      expect(checkPatternsValidity(rules, 'abcdef')[1]).toBe(false)
    })

    it('aggregates multiple rules - invalid if any rule fails', () => {
      const rules = [
        { name: 'startsWithA', pattern: /^a/ },
        { name: 'endsWithZ', pattern: /z$/ }
      ]

      expect(checkPatternsValidity(rules, 'abz')[1]).toBe(true)
      expect(checkPatternsValidity(rules, 'abc')[1]).toBe(false)
    })

    it('filters out async rules from the synchronous evaluation', () => {
      const rules = [
        { name: 'sync', pattern: /^a/ },
        { name: 'async', async: true, pattern: () => Promise.resolve(false) }
      ]

      const [newRules, isValid] = checkPatternsValidity(rules, 'abc')

      expect(newRules).toHaveLength(1)
      expect(newRules[0].name).toBe('sync')
      expect(isValid).toBe(true)
    })

    it('skips validation and returns rules untouched when not required and value is empty', () => {
      const rules = [{ name: 'startsWithA', pattern: /^a/ }]

      const [newRules, isValid] = checkPatternsValidity(rules, '', false)

      expect(isValid).toBe(true)
      expect(newRules).toBe(rules)
      expect(newRules[0].isValid).toBeUndefined()
    })

    it('defaults value to empty string and required to true', () => {
      const rules = [{ name: 'nonEmpty', pattern: /\S/ }]

      expect(checkPatternsValidity(rules)[1]).toBe(false)
    })
  })

  describe('checkPatternsValidityAsync', () => {
    it('combines sync and async rule results - all valid', async () => {
      const rules = [
        { name: 'sync', pattern: /^a/ },
        { name: 'async', async: true, pattern: () => Promise.resolve(true) }
      ]

      const [allRules, isValid] = await checkPatternsValidityAsync(rules, 'abc')

      expect(isValid).toBe(true)
      expect(allRules).toHaveLength(2)
      expect(allRules.map(rule => rule.name).sort()).toEqual(['async', 'sync'])
    })

    it('returns invalid when an async rule fails', async () => {
      const rules = [
        { name: 'sync', pattern: /^a/ },
        { name: 'async', async: true, pattern: () => Promise.resolve(false) }
      ]

      const [, isValid] = await checkPatternsValidityAsync(rules, 'abc')

      expect(isValid).toBe(false)
    })

    it('returns invalid when a sync rule fails even if async passes', async () => {
      const rules = [
        { name: 'sync', pattern: /^a/ },
        { name: 'async', async: true, pattern: () => Promise.resolve(true) }
      ]

      const [, isValid] = await checkPatternsValidityAsync(rules, 'xyz')

      expect(isValid).toBe(false)
    })
  })

  describe('getValidationRules', () => {
    it('returns the rule list for a known type', () => {
      const rules = getValidationRules('common.tag')

      expect(Array.isArray(rules)).toBe(true)
      expect(rules.length).toBeGreaterThan(0)
      expect(rules.every(rule => 'name' in rule && 'label' in rule && 'pattern' in rule)).toBe(true)
    })

    it('returns an empty array for an unknown type', () => {
      expect(getValidationRules('does.not.exist')).toEqual([])
    })

    it('appends additional rules when provided', () => {
      const extra = { name: 'extra', label: 'Extra', pattern: /x/ }
      const base = getValidationRules('common.tag')
      const withExtra = getValidationRules('common.tag', extra)

      expect(withExtra).toHaveLength(base.length + 1)
      expect(withExtra[withExtra.length - 1]).toEqual(extra)
    })

    it('returns a deep clone so the underlying rules are not mutated between calls', () => {
      const first = getValidationRules('common.tag')
      first[0].label = 'mutated'

      const second = getValidationRules('common.tag')

      expect(second[0].label).not.toBe('mutated')
    })
  })

  describe('getInternalLabelsValidationRule', () => {
    it('builds a rule that rejects values present in the internal labels list', () => {
      const rule = getInternalLabelsValidationRule(['owner', 'system'])

      expect(rule.name).toBe('customLabels')
      expect(rule.pattern('owner')).toBe(false)
      expect(rule.pattern('custom')).toBe(true)
    })

    it('accepts any value when no internal labels are provided', () => {
      const rule = getInternalLabelsValidationRule()

      expect(rule.pattern('anything')).toBe(true)
    })
  })
})
