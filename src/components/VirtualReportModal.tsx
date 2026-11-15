import { type ReactNode, useEffect } from 'react'
import { FileText, X } from 'lucide-react'

export interface VirtualReportData {
  id?: string
  prompt: string
  summary?: string | null
  status?: string
}

export interface VirtualReportModalProps {
  report: VirtualReportData | null
  onClose: () => void
  title?: string
}

export function VirtualReportModal({
  report,
  onClose,
  title = 'Mission & output report',
}: VirtualReportModalProps): ReactNode {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!report) return null

  return (
    <div className="wv-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="wv-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="wv-modal-header">
          <div className="wv-modal-title-row">
            <FileText size={16} color="#3b82f6" />
            <h3 className="wv-modal-title">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="wv-modal-close-btn"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="wv-modal-body">
          <div className="wv-modal-prompt-box">
            <span className="wv-modal-section-label">Request / mission brief:</span>
            <p className="wv-modal-prompt-text">{report.prompt}</p>
          </div>

          <div className="wv-modal-output-section">
            <span className="wv-modal-section-label">Generated output / report:</span>
            <div className="wv-modal-output-box">
              {report.summary ||
                'Mission completed successfully. Outputs have been routed to the operations pool.'}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="wv-modal-footer">
          <button
            type="button"
            onClick={onClose}
            className="wv-modal-btn"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
