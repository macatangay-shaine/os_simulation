import { useState, useEffect } from 'react';
import '../styles/diagnostics.css';

const SystemDiagnostics = () => {
  const [healthStatus, setHealthStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [runningTest, setRunningTest] = useState(null);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/system/health/status');
      const data = await response.json();
      setHealthStatus(data);
    } catch (error) {
      console.error('Failed to fetch health status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  const runCleanup = async () => {
    setRunningTest('cleanup');
    try {
      const response = await fetch('http://localhost:8000/system/health/cleanup', {
        method: 'POST',
      });
      const data = await response.json();
      alert(`Cleanup completed!\nOrphaned processes: ${data.orphaned_cleaned}\nMemory freed: ${data.enforcement?.memory_freed || 0} MB`);
      await fetchHealth();
    } catch (error) {
      alert('Cleanup failed: ' + error.message);
    } finally {
      setRunningTest(null);
    }
  };

  const runStressTest = async () => {
    setRunningTest('stress');
    try {
      const response = await fetch('http://localhost:8000/system/health/stress-test', {
        method: 'POST',
      });
      const data = await response.json();
      alert(`Stress test completed!\nProcesses created: ${data.test_processes_created}\nMemory impact: ${data.memory_impact.memory_percent}%`);
      await fetchHealth();
    } catch (error) {
      alert('Stress test failed: ' + error.message);
    } finally {
      setRunningTest(null);
    }
  };

  const enforceMemory = async () => {
    setRunningTest('memory');
    try {
      const response = await fetch('http://localhost:8000/system/health/memory/enforce', {
        method: 'POST',
      });
      const data = await response.json();
      if (data.killed_processes.length > 0) {
        alert(`Memory enforcement completed!\nKilled ${data.killed_processes.length} processes\nFreed ${data.memory_freed} MB`);
      } else {
        alert('Memory within limits - no action needed');
      }
      await fetchHealth();
    } catch (error) {
      alert('Memory enforcement failed: ' + error.message);
    } finally {
      setRunningTest(null);
    }
  };

  if (loading && !healthStatus) {
    return (
      <div className="diagnostics-container">
        <div className="diagnostics-loading">Loading diagnostics...</div>
      </div>
    );
  }

  const getHealthIndicator = (healthy) => {
    return healthy ? (
      <span className="health-indicator healthy">✓ Healthy</span>
    ) : (
      <span className="health-indicator unhealthy">⚠ Issues Detected</span>
    );
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return '#e51400';
      case 'high':
        return '#ff9800';
      case 'medium':
        return '#ff9800';
      case 'low':
        return '#3794ff';
      default:
        return '#6c757d';
    }
  };

  return (
    <div className="diagnostics-container">
      {/* Header */}
      <div className="diagnostics-header">
        <h2>System Diagnostics</h2>
        <div className="diagnostics-overall">
          {getHealthIndicator(healthStatus?.overall_healthy)}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="diagnostics-stats">
        <div className="stat-card">
          <div className="stat-label">Memory Usage</div>
          <div className="stat-value">
            {healthStatus?.memory?.memory_percent}%
          </div>
          <div className="stat-detail">
            {healthStatus?.stats?.memory?.used} / {healthStatus?.stats?.memory?.max} MB
          </div>
          <div className={`stat-status ${healthStatus?.memory?.healthy ? 'ok' : 'warning'}`}>
            {healthStatus?.memory?.warning || 'Normal'}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Running Processes</div>
          <div className="stat-value">
            {healthStatus?.stats?.process_count?.running}
          </div>
          <div className="stat-detail">
            {healthStatus?.stats?.startup_processes} startup
          </div>
          <div className="stat-status ok">Active</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">CPU Average</div>
          <div className="stat-value">
            {healthStatus?.stats?.cpu?.average}%
          </div>
          <div className="stat-detail">
            Across all processes
          </div>
          <div className="stat-status ok">Normal</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">System Integrity</div>
          <div className="stat-value">
            {healthStatus?.integrity?.healthy ? '✓' : '⚠'}
          </div>
          <div className="stat-detail">
            {healthStatus?.integrity?.issues?.length || 0} issues
          </div>
          <div className={`stat-status ${healthStatus?.integrity?.healthy ? 'ok' : 'warning'}`}>
            {healthStatus?.integrity?.healthy ? 'Valid' : 'Issues'}
          </div>
        </div>
      </div>

      {/* Integrity Issues */}
      {healthStatus?.integrity?.issues && healthStatus.integrity.issues.length > 0 && (
        <div className="diagnostics-section">
          <h3>⚠ System Issues</h3>
          <div className="issues-list">
            {healthStatus.integrity.issues.map((issue, index) => (
              <div
                key={index}
                className="issue-item"
                style={{ borderLeftColor: getSeverityColor(issue.severity) }}
              >
                <div className="issue-header">
                  <span className="issue-severity" style={{ color: getSeverityColor(issue.severity) }}>
                    {issue.severity.toUpperCase()}
                  </span>
                  <span className="issue-title">{issue.issue}</span>
                </div>
                {issue.recommendation && (
                  <div className="issue-recommendation">
                    💡 {issue.recommendation}
                  </div>
                )}
                {issue.details && (
                  <div className="issue-details">
                    <pre>{JSON.stringify(issue, null, 2)}</pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="diagnostics-section">
        <h3>System Maintenance</h3>
        <div className="diagnostics-actions">
          <button
            onClick={runCleanup}
            disabled={runningTest !== null}
            className="diag-btn btn-primary"
          >
            {runningTest === 'cleanup' ? 'Running...' : '🧹 Run Cleanup'}
          </button>
          <button
            onClick={enforceMemory}
            disabled={runningTest !== null}
            className="diag-btn btn-warning"
          >
            {runningTest === 'memory' ? 'Running...' : '⚡ Enforce Memory Limits'}
          </button>
          <button
            onClick={runStressTest}
            disabled={runningTest !== null}
            className="diag-btn btn-secondary"
          >
            {runningTest === 'stress' ? 'Running...' : '🔬 Run Stress Test'}
          </button>
          <button
            onClick={fetchHealth}
            disabled={runningTest !== null}
            className="diag-btn btn-secondary"
          >
            ↻ Refresh Status
          </button>
        </div>
      </div>

      {/* Memory Details */}
      <div className="diagnostics-section">
        <h3>Memory Details</h3>
        <div className="memory-chart">
          <div
            className="memory-bar"
            style={{
              width: `${healthStatus?.memory?.memory_percent}%`,
              backgroundColor:
                healthStatus?.memory?.memory_percent >= 90
                  ? '#e51400'
                  : healthStatus?.memory?.memory_percent >= 75
                  ? '#ff9800'
                  : '#0078d4',
            }}
          >
            {healthStatus?.memory?.memory_percent}%
          </div>
        </div>
        <div className="memory-info">
          <div className="memory-row">
            <span>Used:</span>
            <span>{healthStatus?.stats?.memory?.used} MB</span>
          </div>
          <div className="memory-row">
            <span>Available:</span>
            <span>{healthStatus?.stats?.memory?.available} MB</span>
          </div>
          <div className="memory-row">
            <span>Maximum:</span>
            <span>{healthStatus?.stats?.memory?.max} MB</span>
          </div>
        </div>
      </div>

      {/* Process Summary */}
      <div className="diagnostics-section">
        <h3>Process Summary</h3>
        <div className="process-summary">
          <div className="summary-item">
            <span className="summary-label">Total Processes:</span>
            <span className="summary-value">
              {healthStatus?.stats?.process_count?.total}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Running:</span>
            <span className="summary-value success">
              {healthStatus?.stats?.process_count?.running}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Terminated:</span>
            <span className="summary-value muted">
              {healthStatus?.stats?.process_count?.terminated}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Startup Processes:</span>
            <span className="summary-value">
              {healthStatus?.stats?.startup_processes}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemDiagnostics;
