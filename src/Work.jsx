import { useState } from 'react'
import { chips, cases, rows, also } from './portfolio.js'

const ext = { target: '_blank', rel: 'noopener noreferrer' }

function Case({ c, i, hidden }) {
  return (
    <article className="case" hidden={hidden} data-reveal>
      <span className="idx" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
      <p className="meta">{c.meta}</p>
      <h3>{c.title}</h3>
      {c.metrics.length > 0 && (
        <ul className="metrics">{c.metrics.map(([n, l]) => <li key={l}><b>{n}</b><span>{l}</span></li>)}</ul>
      )}
      <dl>
        <dt>Problem</dt><dd>{c.problem}</dd>
        <dt>What I did</dt><dd>{c.did}</dd>
        <dt>Result</dt><dd>{c.result}</dd>
      </dl>
      {c.stack.length > 0 && <ul className="tags">{c.stack.map(t => <li key={t}>{t}</li>)}</ul>}
      {c.links?.map(([t, u]) => <a key={u} className="cta" href={u} {...ext}>{t} ↗</a>)}
    </article>
  )
}

export function Work() {
  const [f, setF] = useState('All')
  const off = cats => f !== 'All' && !cats.includes(f)
  return (
    <div className="work">
      <div className="wbar">
        <h2 className="sec">Selected work</h2>
        <div className="chips" role="group" aria-label="Filter work">
          {chips.map(c => <button key={c} className="chip" aria-pressed={f === c} onClick={() => setF(c)}>{c}</button>)}
        </div>
      </div>

      <div className="cases">{cases.map((c, i) => <Case key={c.id} c={c} i={i} hidden={off(c.cats)} />)}</div>

      <h3 className="tier">More projects</h3>
      <ul className="rows">
        {rows.map(r => (
          <li key={r.id} hidden={off(r.cats)} data-reveal>
            <div className="rname">
              {r.url ? <a href={r.url} {...ext}>{r.name} <span aria-hidden="true">↗</span></a> : <span>{r.name}</span>}
              {r.badge && <em>{r.badge}</em>}
            </div>
            <p>{r.text}</p>
            <ul className="tags">{r.tags.map(t => <li key={t}>{t}</li>)}</ul>
          </li>
        ))}
      </ul>

      {also.some(a => !off(a.cats)) && (
        <>
          <h3 className="tier">Also</h3>
          <ul className="also">{also.map(a => <li key={a.name} hidden={off(a.cats)}><b>{a.name}</b> {a.text}</li>)}</ul>
        </>
      )}
    </div>
  )
}
