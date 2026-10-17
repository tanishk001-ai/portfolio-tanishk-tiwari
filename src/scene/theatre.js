import { useEffect, useRef } from 'react'
import { getProject } from '@theatre/core'

export const clean = n => n.replace(/[^A-Za-z0-9]/g, '')   // Theatre 0.7.2 compound keys must be alphanumeric (see scripts/sanitize.py)

const cache = new Map()
/** Load a section's exported Theatre.js project state and return its "Scene" sheet (cached). */
export function loadSheet(id, url) {
  if (!cache.has(id)) cache.set(id, fetch(url).then(r => r.json()).then(async state => {
    const project = getProject(`Editions-${id}`, { state }); await project.ready
    const sh = Object.values(state.sheetsById)[0]
    const kfs = sh.sequence.tracksByObject?.effects && Object.values(sh.sequence.tracksByObject.effects.trackData)
      .find(t => t.__debugName?.includes('overlay') && t.__debugName?.includes('"position"') && t.keyframes.length)?.keyframes
    const length = sh.sequence.length
    const objects = Object.keys(sh.sequence.tracksByObject || {}).concat(Object.keys(sh.staticOverrides?.byObject || {}))
    // Scroll-driven part of the sequence: up to the moment the overlay finishes covering the scene (or the whole sequence if it never covers).
    const covers = !!kfs
    const cover = covers ? Math.max(...kfs.map(k => k.position)) : length
    const ov = sh.staticOverrides?.byObject?.effects?.overlay?.color
    return { sheet: project.sheet('Scene'), objects, length, cover, covers, bg: ov ? [ov.r, ov.g, ov.b] : [0.86, 0.86, 0.82] }
  }))
  return cache.get(id)
}

/** Declare a Theatre object on the sheet and call `onValues` on every change (props mirror the original schemas). */
export function useTheatre(sheet, key, props, onValues) {
  const cb = useRef(onValues); cb.current = onValues
  useEffect(() => {
    const obj = sheet.object(key, props, { reconfigure: true })
    const un = obj.onValuesChange(v => cb.current(v))
    return () => { un(); sheet.detachObject(key) }
    // eslint-disable-next-line
  }, [sheet, key])
}
