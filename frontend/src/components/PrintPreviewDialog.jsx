import { useState } from 'react'
import { X, Printer, ChevronLeft, ChevronRight } from 'lucide-react'

export default function PrintPreviewDialog({ content, fileName, pages, onPrint, onCancel }) {
  const [currentPage, setCurrentPage] = useState(1)
  const [copies, setCopies] = useState(1)
  const [colorMode, setColorMode] = useState('color')
  const [paperSize, setPaperSize] = useState('A4')
  const [orientation, setOrientation] = useState('portrait')

  const totalPages = Math.max(1, pages)
  const previewLines = Math.floor(content.length / totalPages)

  const getPageContent = () => {
    const start = (currentPage - 1) * previewLines
    const end = Math.min(start + previewLines, content.length)
    return content.substring(start, end)
  }

  const handlePrint = () => {
    onPrint({
      fileName,
      pages: totalPages,
      copies,
      colorMode,
      paperSize,
      orientation,
      timestamp: new Date().toISOString()
    })
    onCancel()
  }

  return (
    <div className="print-preview-overlay">
      <div className="print-preview-dialog">
        <div className="print-preview-header">
          <div>
            <h2>Print Preview</h2>
            <p className="print-preview-subtitle">{fileName}</p>
          </div>
          <button className="print-preview-close" onClick={onCancel}>
            <X size={20} />
          </button>
        </div>

        <div className="print-preview-content">
          <div className="print-preview-viewport">
            <div className="print-preview-page">
              <div className="print-preview-page-header">
                {fileName} — Page {currentPage} of {totalPages}
              </div>
              <div className="print-preview-page-content">
                {getPageContent()}
              </div>
              <div className="print-preview-page-footer">
                {new Date().toLocaleString()}
              </div>
            </div>
          </div>

          <div className="print-preview-controls">
            <div className="print-preview-navigation">
              <button
                className="print-preview-nav-btn"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16} />
              </button>
              <span className="print-preview-page-info">
                {currentPage} / {totalPages}
              </span>
              <button
                className="print-preview-nav-btn"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="print-preview-settings">
              <div className="print-setting">
                <label>Copies:</label>
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={copies}
                  onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                  className="print-setting-input"
                />
              </div>

              <div className="print-setting">
                <label>Color:</label>
                <select value={colorMode} onChange={(e) => setColorMode(e.target.value)} className="print-setting-select">
                  <option value="color">Color</option>
                  <option value="grayscale">Grayscale</option>
                  <option value="bw">Black & White</option>
                </select>
              </div>

              <div className="print-setting">
                <label>Paper:</label>
                <select value={paperSize} onChange={(e) => setPaperSize(e.target.value)} className="print-setting-select">
                  <option value="A4">A4</option>
                  <option value="Letter">Letter</option>
                  <option value="A3">A3</option>
                </select>
              </div>

              <div className="print-setting">
                <label>Orientation:</label>
                <select value={orientation} onChange={(e) => setOrientation(e.target.value)} className="print-setting-select">
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="print-preview-footer">
          <button className="print-preview-btn cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="print-preview-btn print" onClick={handlePrint}>
            <Printer size={16} />
            Print ({copies} {copies === 1 ? 'copy' : 'copies'})
          </button>
        </div>
      </div>
    </div>
  )
}
