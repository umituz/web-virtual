import { type ReactNode, useEffect } from 'react'
import { FileText, X } from 'lucide-react'
import { type LabelOverrides, mergeLabels } from './labels'

export interface VirtualReportData {
  id?: string
  prompt: string
  summary?: string | null
  status?: string
}

export interface VirtualReportModalLabels {
  defaultTitle: string
  close: string
  requestLabel: string
  outputLabel: string
  outputFallback: string
  closeButton: string
}

export const DEFAULT_VIRTUAL_REPORT_MODAL_LABELS: Readonly<VirtualReportModalLabels> =
  Object.freeze({
    defaultTitle: 'Mission & output report',
    close: 'Close',
    requestLabel: 'Request / mission brief:',
    outputLabel: 'Generated output / report:',
    outputFallback:
      'Mission completed successfully. Outputs have been routed to the operations pool.',
    closeButton: 'Close',
  })

export interface VirtualReportModalProps {
  report: VirtualReportData | null
  onClose: () => void
  title?: string
  labels?: LabelOverrides<VirtualReportModalLabels>
}

export function VirtualReportModal({
  report,
  onClose,
  title,
  labels,
}: VirtualReportModalProps): ReactNode {
  const t = mergeLabels(DEFAULT_VIRTUAL_REPORT_MODAL_LABELS, labels)

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
        <div className="wv-modal-header">
          <div className="wv-modal-title-row">
            <FileText size={16} color="#3b82f6" />
            <h3 className="wv-modal-title">{title ?? t.defaultTitle}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="wv-modal-close-btn"
            title={t.close}
          >
            <X size={16} />
          </button>
        </div>

        <div className="wv-modal-body">
          <div className="wv-modal-prompt-box">
            <span className="wv-modal-section-label">{t.requestLabel}</span>
            <p className="wv-modal-prompt-text">{report.prompt}</p>
          </div>

          <div className="wv-modal-output-section">
            <span className="wv-modal-section-label">{t.outputLabel}</span>
            <div className="wv-modal-output-box">
              {report.summary || t.outputFallback}
            </div>
          </div>
        </div>

        <div className="wv-modal-footer">
          <button
            type="button"
            onClick={onClose}
            className="wv-modal-btn"
          >
            {t.closeButton}
          </button>
        </div>
      </div>
    </div>
  )
}
