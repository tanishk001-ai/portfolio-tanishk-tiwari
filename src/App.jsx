import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import content from './content.json'
import { loadSheet } from './scene/theatre.js'
import { Scene } from './scene/Scene.jsx'
import { Loader } from './Intro.jsx'
import { Work } from './Work.jsx'
import { About } from './About.jsx'
import { profile } from './portfolio.js'

const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
const lum = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b
const css = ([r, g, b]) => `rgb(${Math.round(r * 255)} ${Math.round(g * 255)} ${Math.round(b * 255)})`
const INTRO = 1.8   // hero timeline: camera settles on the wide shot at 1.8s; scroll then dives in
const warmed = new Set()
const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
const narrow = typeof matchMedia !== 'undefined' && matchMedia('(max-width: 700px)').matches
const TRACK_VH = narrow ? { hero: 150, work: 110, about: 110, contact: 110 } : { hero: 200, work: 140, about: 140, contact: 150 }   // scroll length of each scene (keeps the page ~10 viewports)
const blocks = [{ id: 'hero', hero: true, ...content.hero }, ...content.sections].map(b => ({ ...b, vh: TRACK_VH[b.id] }))
const LABEL = { hero: 'Top', work: 'Work', about: 'About', contact: 'Contact' }
const TITLE = 'Tanishk<br>Tiw<i>ar</i>i<br>Portfolio'
const ext = { target: '_blank', rel: 'noopener noreferrer' }

export default function App() {
  const tracks = useRef({}), covered = useRef({})
  const [metas, setMetas] = useState({})
  const [active, setActive] = useState({ id: 'hero', visible: true, near: true })
  const [scene, setScene] = useState(null)               // { id, sheet, meta }
  const [ready, setReady] = useState(null)               // id of the section whose WebGL scene has finished loading

  // Load every section's Theatre state up-front (small JSON) so backgrounds/cover times are known.
  useEffect(() => { blocks.forEach(b => loadSheet(b.id, b.scene).then(m => setMetas(o => ({ ...o, [b.id]: m })))) }, [])
  useEffect(() => { const m = metas[active.id]; if (m && scene?.id !== active.id) setScene({ id: active.id, sheet: m.sheet, meta: m }) }, [active.id, metas, scene])

  // One continuous rAF loop: scroll -> target sequence time -> exponentially damped -> Theatre sheet.
  // (Driving the sheet straight from scroll events made wheel notches show up as visible steps.)
  const [phase, setPhase] = useState('loading')           // loading -> reveal -> done
  const introStart = useRef(null), cur = useRef({ id: null, t: 0 }), stateRef = useRef({ id: 'hero', visible: true, near: true })
  const born = useRef(performance.now())
  useEffect(() => {                                                      // reveal once the hero scene is ready (min 2.4s on screen, 10s failsafe)
    if (phase !== 'loading') return
    const wait = ready === 'hero' ? Math.max(0, (reduce ? 300 : 2400) - (performance.now() - born.current)) : Math.max(0, 10000 - (performance.now() - born.current))
    const t = setTimeout(() => setPhase('reveal'), wait); return () => clearTimeout(t)
  }, [ready, phase])
  useEffect(() => { if (phase === 'reveal') { introStart.current = performance.now(); const t = setTimeout(() => setPhase('done'), reduce ? 200 : 1900); return () => clearTimeout(t) } }, [phase])
  useEffect(() => { document.body.style.overflow = phase === 'done' ? '' : 'hidden'; return () => { document.body.style.overflow = '' } }, [phase])
  useEffect(() => {
    let raf = 0, last = performance.now()
    const loop = now => {
      raf = requestAnimationFrame(loop)
      const dt = Math.min(0.1, (now - last) / 1000); last = now
      const vh = innerHeight; let shown = null, upcoming = null, near = false
      const info = {}
      for (const b of blocks) {
        const el = tracks.current[b.id]; if (!el) continue
        const r = el.getBoundingClientRect()
        const p = clamp(-r.top / Math.max(1, r.height - vh), 0, 1)
        info[b.id] = { r, p }
        if (r.top < vh && r.bottom > 0) shown = b.id                          // a scene is on screen
        else if (r.top >= vh && !upcoming) upcoming = b.id                    // first track still below the fold
        if (r.top < vh * 3 && r.bottom > -vh) near = true
        el.style.setProperty('--p', p.toFixed(3))
        const m = metas[b.id]; const cov = !!m && m.covers && p * m.cover > m.cover * 0.55
        if (covered.current[b.id] !== cov) { covered.current[b.id] = cov; el.classList.toggle('covered', cov) }
      }
      // While cards cover the screen, already switch to the next scene so it is mounted and ready before its track arrives.
      const act = shown || upcoming || blocks[blocks.length - 1].id
      const visible = !!shown
      const st = stateRef.current
      if (st.id !== act || st.visible !== visible || st.near !== near) { stateRef.current = { id: act, visible, near }; setActive({ id: act, visible, near }) }
      const m = metas[act], i = info[act]; if (!m || !i) return
      let target = i.p * m.cover
      if (act === 'hero') {
        const intro = reduce ? INTRO : introStart.current == null ? 0 : Math.min(INTRO, (now - introStart.current) / 1000)
        target = Math.min(m.length, intro + i.p * (m.length - INTRO))
      }
      if (cur.current.id !== act) cur.current = { id: act, t: target }        // new section: start where the scroll is, no sweep
      cur.current.t += (target - cur.current.t) * (reduce ? 1 : 1 - Math.exp(-dt * 9))
      if (Math.abs(target - cur.current.t) < 1e-4) cur.current.t = target
      m.sheet.sequence.position = cur.current.t
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [metas])

  // Warm the HTTP cache for the next two sections' models/textures so mounting them doesn't stall.
  useEffect(() => {
    const i = blocks.findIndex(b => b.id === active.id)
    blocks.slice(i + 1, i + 3).forEach(b => b.assets.forEach(a => { if (!warmed.has(a.src)) { warmed.add(a.src); fetch(a.src).catch(() => {}) } }))
  }, [active.id])

  const sec = scene && blocks.find(b => b.id === scene.id)
  const sceneSection = useMemo(() => sec && { ...sec, hasParticles: scene.meta.objects.includes('particles') }, [sec, scene])
  const go = id => tracks.current[id]?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' })

  // Fade content in as it scrolls into view (skipped for reduced motion).
  useEffect(() => {
    const els = document.querySelectorAll('[data-reveal]')
    if (reduce || !('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return }
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } }), { rootMargin: '0px 0px -8% 0px' })
    els.forEach(e => io.observe(e)); return () => io.disconnect()
  }, [phase])

  const intro = b => {
    if (b.id === 'hero') return (<>
      <h1 className="hname">{profile.name}</h1>
      <p className="subline">{profile.subline}</p>
      <div className="btns">
        <a className="btn solid" href="#work" onClick={e => { e.preventDefault(); go('work') }}>See work</a>
        <a className="btn" href={profile.resume} {...ext}>Resume</a>
        <a className="btn" href={`mailto:${profile.email}`}>Email</a>
      </div>
      <p className="small">{profile.graduating}</p></>)
    if (b.id === 'work') return <><h2>Work</h2><p>Case studies first, then everything else I have built.</p></>
    if (b.id === 'about') return <><h2>About</h2><p>A builder with a PM’s eye.</p></>
    return (<>
      <h2>Let’s talk</h2><p>{profile.availability}</p>
      <div className="btns">
        <a className="btn solid" href={`mailto:${profile.email}`}>{profile.email}</a>
        <a className="btn" href={profile.linkedin} {...ext}>LinkedIn</a>
        <a className="btn" href={profile.github} {...ext}>GitHub</a>
        <a className="btn" href={profile.resume} {...ext}>Resume PDF</a>
      </div></>)
  }

  return (<>
    {phase !== 'done' && <Loader phase={phase} title={TITLE} />}
    <header className="top">
      <a className="brand" href="#top" onClick={e => { e.preventDefault(); go('hero') }}>{profile.name}</a>
      <nav className="links">{['work', 'about', 'contact'].map(id => <a key={id} href={`#${id}`} onClick={e => { e.preventDefault(); go(id) }}>{LABEL[id]}</a>)}</nav>
      <a className="btn solid sm" href={`mailto:${profile.email}`}>Email</a>
    </header>
    <aside className="side" style={{ opacity: phase === 'done' ? 1 : 0 }}>{blocks.map(b => <button key={b.id} className={active.id === b.id ? 'on' : ''} onClick={() => go(b.id)} aria-label={LABEL[b.id]}><i /><span>{LABEL[b.id]}</span></button>)}</aside>

    <div className={'canvas' + (active.visible ? '' : ' off') + (ready === scene?.id && scene?.id === active.id ? ' on' : '')}>
      <Canvas dpr={[1, 1.5]} frameloop={active.near ? 'always' : 'never'} gl={{ antialias: false, alpha: true }} camera={{ fov: 30, position: [0, 0, 4] }}>
        <Suspense fallback={null}>{scene && sceneSection && <Scene key={scene.id} section={sceneSection} sheet={scene.sheet} onReady={() => setReady(scene.id)} />}</Suspense>
      </Canvas>
    </div>

    <main>
      {blocks.map(b => {
        const m = metas[b.id], bg = m?.bg || [0.86, 0.86, 0.82]
        return (
          <section key={b.id} id={b.id} className="block">
            <div className="track" style={{ height: `${b.vh}vh` }} ref={el => (tracks.current[b.id] = el)}>
              <div className="stickybg">{b.fallback && <img className={'fallback' + (ready === b.id ? ' hide' : '')} src={b.fallback.src} alt="" />}</div>
              <div className="stickyfg">
                {b.id === 'hero' && <div className="scrim" aria-hidden="true" />}
                <div className={'intro' + (b.id === 'hero' ? ' hero' : '') + (b.mode === 'light' ? ' light' : '')}>{intro(b)}</div>
                {b.id !== 'contact' && <div className="scrollcue" aria-hidden="true"><span /></div>}
              </div>
            </div>
            {(b.id === 'work' || b.id === 'about') && (
              <div className="cards" style={{ background: css(bg) }}>{b.id === 'work' ? <Work /> : <About />}</div>
            )}
          </section>
        )
      })}
    </main>
    <footer><p>© {new Date().getFullYear()} {profile.name} · VIT Bhopal</p></footer>
  </>)
}
