import { useEffect } from 'react';
import { X } from 'lucide-react';

export function DetailsModal({ title, eyebrow, onClose, children }) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose();
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="details-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="details-modal" role="dialog" aria-modal="true" aria-labelledby="details-modal-title">
        <div className="details-modal-header">
          <div>
            {eyebrow && <span className="eyebrow">{eyebrow}</span>}
            <h2 id="details-modal-title">{title}</h2>
          </div>
          <button type="button" className="icon-button details-modal-close" onClick={onClose} aria-label="Fechar detalhes" title="Fechar">
            <X size={18} />
          </button>
        </div>
        <div className="details-modal-content">{children}</div>
      </section>
    </div>
  );
}
