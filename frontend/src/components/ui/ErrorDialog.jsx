import { useState } from 'react';
import '../../styles/ui/error-dialog.css';

const ErrorDialog = ({ error, onClose, onReport }) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!error) return null;

  const handleReport = async () => {
    if (onReport) {
      await onReport(error);
    }

    // Log the error to the event system
    try {
      await fetch('http://localhost:8000/events/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          level: 'Error',
          category: 'Application',
          source: error.source || 'Unknown',
          event_id: error.errorCode ? parseInt(error.errorCode) : 9000,
          message: error.message || 'An error occurred',
          username: error.username,
          details: error.details,
          stack_trace: error.stackTrace,
        }),
      });
    } catch (e) {
      console.error('Failed to log error:', e);
    }

    onClose();
  };

  return (
    <div className="error-dialog-overlay" onClick={onClose}>
      <div className="error-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="error-dialog-header">
          <div className="error-icon">⚠️</div>
          <div className="error-title-section">
            <h2 className="error-title">{error.title || 'Application Error'}</h2>
            {error.errorCode && (
              <span className="error-code">Error Code: {error.errorCode}</span>
            )}
          </div>
          <button className="error-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="error-dialog-body">
          <p className="error-message">{error.message}</p>

          {error.stackTrace && (
            <div className="error-details-toggle">
              <button
                className="details-toggle-btn"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? '▼' : '▶'} Technical Details
              </button>
            </div>
          )}

          {showDetails && error.stackTrace && (
            <div className="error-stack-trace">
              <pre>{error.stackTrace}</pre>
            </div>
          )}

          {error.details && (
            <div className="error-additional-info">
              <strong>Additional Information:</strong>
              <pre>{JSON.stringify(error.details, null, 2)}</pre>
            </div>
          )}
        </div>

        <div className="error-dialog-footer">
          <button className="error-btn error-btn-secondary" onClick={onClose}>
            Close
          </button>
          {error.stackTrace && (
            <button className="error-btn error-btn-primary" onClick={handleReport}>
              Report Error
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorDialog;
