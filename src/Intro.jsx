/** Framed title shown on the loading screen. */
export function Panel({ title }) {
  return (
    <div className="panel">
      <h1 className="ptitle" dangerouslySetInnerHTML={{ __html: title }} />
    </div>
  )
}

const draw = (d, i, extra = {}) => <path key={i} d={d} pathLength="1" style={{ '--d': `${0.08 * i}s` }} {...extra} />

/** Guide lines (golden-ratio style construction) drawn behind the frame on the black loading screen. */
function Guides() {
  const lines = [
    'M1000 567 L0 0', 'M1000 567 L2000 0', 'M1000 567 L0 1134', 'M1000 567 L2000 1134',
    'M1000 567 L0 380', 'M1000 567 L2000 760', 'M1000 567 L520 0', 'M1000 567 L1480 1134',
    'M1000 567 C1000 567 940 300 862 0', 'M1000 567 C1000 567 1060 300 1138 0', 'M1000 567 C1000 567 940 830 862 1134', 'M1000 567 C1000 567 1060 830 1138 1134',
    'M768 0 L768 1134', 'M1231 0 L1231 1134', 'M1000 0 L1000 1134',
    'M0 426 L363 426', 'M1231 708 L2000 708', 'M483 0 L483 200', 'M1517 934 L1517 1134',
    'M483 251 L768 251', 'M1231 883 L952 883',
    'M550 251 L550 318 L593 318 M593 251 L593 318', 'M1407 815 L1407 883 L1450 883 M1450 815 L1450 883',
  ]
  return <svg className="guides" viewBox="0 0 2000 1134" preserveAspectRatio="xMidYMid slice" aria-hidden="true">{lines.map((d, i) => draw(d, i))}</svg>
}

/** Black loading screen. phase: 'loading' (title centred) -> 'reveal' (frame and title fade, black fades) -> unmounted. */
export function Loader({ phase, title }) {
  return (
    <div className={'loader ' + phase} aria-hidden={phase === 'reveal'}>
      <div className="lbg" />
      <Guides />
      <Panel title={title} />
    </div>
  )
}
