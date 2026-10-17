import { about } from './portfolio.js'

const List = ({ title, items }) => (
  <section><h3>{title}</h3><ul>{items.map(i => <li key={i}>{i}</li>)}</ul></section>
)

export function About() {
  return (
    <div className="about" data-reveal>
      <p className="summary">{about.summary}</p>
      <div className="proof">
        <section><h3>Education</h3><ul>{about.education.map(([a, b]) => <li key={a}>{a}<small>{b}</small></li>)}</ul></section>
        <List title="Certifications" items={about.certs} />
        <List title="Recognition" items={about.recognition} />
        <List title="Community" items={about.community} />
      </div>
    </div>
  )
}
