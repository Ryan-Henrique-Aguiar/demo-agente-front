import changelogRaw from '../../CHANGELOG.md?raw';
import { PageHeader } from '../components/PageHeader.jsx';

export function Changelog() {
  const sections = parseChangelog(changelogRaw);

  return (
    <section className="changelog-page">
      <PageHeader
        eyebrow="Histórico"
        title="Atualizações"
        description="Registro interno de mudanças no sistema."
      />
      <div className="changelog-list">
        {sections.map((section) => (
          <div className="changelog-entry" key={section.version}>
            <h3>{section.version}</h3>
            <ul>
              {section.items.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function parseChangelog(raw) {
  const lines = raw.split('\n');
  const sections = [];
  let current = null;

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (current) sections.push(current);
      current = { version: line.replace('## ', '').trim(), items: [] };
    } else if (line.trim().startsWith('- ') && current) {
      current.items.push(line.trim().replace(/^- /, ''));
    }
  }
  if (current) sections.push(current);
  return sections;
}