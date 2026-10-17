import { useEffect, useRef } from 'react'
import { getProject } from '@theatre/core'

export const clean = n => n.replace(/[^A-Za-z0-9]/g, '')   // Theatre 0.7.2 compound keys must be alphanumeric (see scripts/sanitize.py)

const cache = new Map()
/** Load a section's exported Theatre.js project state and return its "Scene" sheet (cached). */
export function loadSheet(id, url) {
  if (!cache.has(id)) cache.set(id, fetch(url).then(r => r.json()).then(async state => {
    const project = getProject(`Editions-${id}`, { state }); await project.ready
    const sh = Object.values(state.sheetsById)[0]
    const eff = sh.sequence.tracksByObject?.effects?.trackData
    const track = key => eff && Object.values(eff).find(t => t.__debugName?.includes('overlay') && t.__debugName?.includes(key) && t.keyframes.length)?.keyframes
    const length = sh.sequence.length
    const objects = Object.keys(sh.sequence.tracksByObject || {}).concat(Object.keys(sh.staticOverrides?.byObject || {}))
    // Scroll-driven part of the sequence ends the moment the overlay first fully covers the scene (and holds there, so the track
    // ends on the same light colour as the content below). Scenes whose overlay never covers play their whole sequence.
    const firstCover = kfs => kfs ? (kfs.find(k => k.value >= -0.05) || kfs[kfs.length - 1]).position : null
    const kd = track('"position"'), km = track('"mobilePosition"')
    const covers = !!kd
    const cover = firstCover(kd) ?? length, coverM = firstCover(km) ?? cover
    const ov = sh.staticOverrides?.byObject?.effects?.overlay?.color
    return { sheet: project.sheet('Scene'), objects, length, cover, coverM, covers, bg: ov ? [ov.r, ov.g, ov.b] : [0.86, 0.86, 0.82] }
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
