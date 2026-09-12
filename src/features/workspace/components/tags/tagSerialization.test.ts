import { describe, expect, it } from 'vitest'
import {
  dedupeTagIds,
  parseTagIds,
  serializeTagIds,
  toggleTagId,
} from './tagSerialization'

describe('parseTagIds', () => {
  it('parses a valid JSON tag id array', () => {
    expect(parseTagIds('["tag-1","tag-2"]')).toEqual(['tag-1', 'tag-2'])
  })

  it('returns [] for invalid JSON strings', () => {
    expect(parseTagIds('not-json')).toEqual([])
    expect(parseTagIds('{"tag":"tag-1"}')).toEqual([])
    expect(parseTagIds('  ')).toEqual([])
  })

  it('returns [] for JSON that is not an array', () => {
    expect(parseTagIds('null')).toEqual([])
    expect(parseTagIds('"tag-1"')).toEqual([])
    expect(parseTagIds('42')).toEqual([])
  })

  it('returns [] for empty string', () => {
    expect(parseTagIds('')).toEqual([])
  })

  it('returns [] for null, undefined, and non-string values', () => {
    expect(parseTagIds(null)).toEqual([])
    expect(parseTagIds(undefined)).toEqual([])
    expect(parseTagIds(['tag-1'])).toEqual([])
    expect(parseTagIds(0)).toEqual([])
  })

  it('dedupes duplicate ids', () => {
    expect(parseTagIds('["tag-1","tag-2","tag-1"]')).toEqual([
      'tag-1',
      'tag-2',
    ])
  })

  it('filters out non-string entries', () => {
    expect(parseTagIds('["tag-1",1,null,"tag-2"]')).toEqual([
      'tag-1',
      'tag-2',
    ])
  })

  it('preserves an empty array', () => {
    expect(parseTagIds('[]')).toEqual([])
  })
})

describe('serializeTagIds', () => {
  it('serializes ids to a JSON string', () => {
    expect(serializeTagIds(['tag-1', 'tag-2'])).toBe('["tag-1","tag-2"]')
  })

  it('dedupes before stringifying', () => {
    expect(serializeTagIds(['tag-1', 'tag-1', 'tag-2'])).toBe(
      '["tag-1","tag-2"]',
    )
  })

  it('serializes an empty array', () => {
    expect(serializeTagIds([])).toBe('[]')
  })

  it('round-trips parse(serialize(ids))', () => {
    const ids = ['tag-1', 'tag-2', 'tag-1']
    expect(parseTagIds(serializeTagIds(ids))).toEqual(['tag-1', 'tag-2'])
  })
})

describe('dedupeTagIds', () => {
  it('removes duplicates while preserving first-occurrence order', () => {
    expect(dedupeTagIds(['a', 'b', 'a', 'c', 'b'])).toEqual(['a', 'b', 'c'])
  })

  it('keeps already-unique ids', () => {
    expect(dedupeTagIds(['a', 'b'])).toEqual(['a', 'b'])
  })

  it('handles an empty array', () => {
    expect(dedupeTagIds([])).toEqual([])
  })
})

describe('toggleTagId - multi-select behavior', () => {
  it('adds an id to the selection', () => {
    expect(toggleTagId(['tag-1'], 'tag-2')).toEqual(['tag-1', 'tag-2'])
  })

  it('removes an already-selected id', () => {
    expect(toggleTagId(['tag-1', 'tag-2'], 'tag-1')).toEqual(['tag-2'])
  })

  it('selecting the already-selected last id turns it off', () => {
    expect(toggleTagId(['tag-1'], 'tag-1')).toEqual([])
  })

  it('appends in creation order', () => {
    expect(toggleTagId([], 'tag-2')).toEqual(['tag-2'])
    expect(toggleTagId(['tag-3'], 'tag-1')).toEqual(['tag-3', 'tag-1'])
  })

  it('never produces duplicates across repeated toggles', () => {
    let selected: string[] = []
    for (const id of ['a', 'b', 'a', 'c', 'b']) {
      selected = toggleTagId(selected, id)
      expect(new Set(selected).size).toBe(selected.length)
    }
  })
})