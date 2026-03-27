/**
 * Error handling utilities for JezOS
 * Provides centralized error logging and formatting
 */

/**
 * Log an error to the backend event system
 * @param {string} source - The source component (e.g., 'FileExplorer', 'Terminal')
 * @param {string} message - The error message
 * @param {object} options - Additional options
 * @returns {Promise<void>}
 */
export async function logError(source, message, options = {}) {
  try {
    const errorData = {
      level: options.level || 'Error',
      category: options.category || 'Application',
      source: source,
      event_id: options.eventId || 9000,
      message: message,
      username: options.username || null,
      details: options.details || null,
      stack_trace: options.stackTrace || null,
    };

    await fetch('http://localhost:8000/events/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(errorData),
    });
  } catch (e) {
    // Silently fail - don't want error logging to crash the app
    console.error('Failed to log error to backend:', e);
  }
}

/**
 * Log a warning to the backend event system
 * @param {string} source - The source component
 * @param {string} message - The warning message
 * @param {object} options - Additional options
 * @returns {Promise<void>}
 */
export async function logWarning(source, message, options = {}) {
  await logError(source, message, { ...options, level: 'Warning' });
}

/**
 * Log an info message to the backend event system
 * @param {string} source - The source component
 * @param {string} message - The info message
 * @param {object} options - Additional options
 * @returns {Promise<void>}
 */
export async function logInfo(source, message, options = {}) {
  await logError(source, message, { ...options, level: 'Information', category: 'System' });
}

/**
 * Format an error object for display in ErrorDialog
 * @param {Error} error - The JavaScript error object
 * @param {string} title - Dialog title
 * @param {string} source - Source component
 * @returns {object} Formatted error object
 */
export function formatError(error, title = 'Application Error', source = 'Unknown') {
  return {
    title: title,
    message: error.message || 'An unexpected error occurred',
    errorCode: error.code || 'ERR_UNKNOWN',
    stackTrace: error.stack || null,
    source: source,
    details: {
      name: error.name,
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Handle API errors consistently
 * @param {Response} response - Fetch response object
 * @param {string} context - Context of the request (e.g., 'loading files')
 * @returns {Promise<Error>} Formatted error
 */
export async function handleApiError(response, context = 'making request') {
  let errorMessage = `Failed while ${context}`;
  let errorCode = `HTTP_${response.status}`;

  try {
    const data = await response.json();
    if (data.detail) {
      errorMessage = data.detail;
    }
  } catch {
    // If response is not JSON, use status text
    errorMessage = `${errorMessage}: ${response.statusText}`;
  }

  const error = new Error(errorMessage);
  error.code = errorCode;
  error.status = response.status;
  return error;
}

/**
 * Wrap an async function with error handling
 * @param {Function} fn - The async function to wrap
 * @param {string} source - Source component name
 * @param {Function} onError - Error callback (optional)
 * @returns {Function} Wrapped function
 */
export function withErrorHandling(fn, source, onError = null) {
  return async function (...args) {
    try {
      return await fn(...args);
    } catch (error) {
      console.error(`[${source}] Error:`, error);

      // Log to backend
      await logError(source, error.message, {
        stackTrace: error.stack,
        details: {
          args: args,
          timestamp: new Date().toISOString(),
        },
      });

      // Call error callback if provided
      if (onError) {
        onError(formatError(error, `${source} Error`, source));
      }

      // Re-throw to allow caller to handle if needed
      throw error;
    }
  };
}

/**
 * Create an error boundary for React components (use with try/catch in effects)
 * @param {Error} error - The error that occurred
 * @param {string} componentName - Name of the component
 * @param {Function} setError - State setter for error dialog
 */
export async function handleComponentError(error, componentName, setError) {
  console.error(`[${componentName}] Component error:`, error);

  const formattedError = formatError(
    error,
    `${componentName} Error`,
    componentName
  );

  // Log to backend
  await logError(componentName, error.message, {
    stackTrace: error.stack,
    category: 'Application',
    eventId: 2002, // APP_CRASH event ID
  });

  // Show error dialog
  if (setError) {
    setError(formattedError);
  }
}

/**
 * Event IDs for common events (matches backend event_logger.py)
 */
export const EventIds = {
  APP_START: 2000,
  APP_STOP: 2001,
  APP_CRASH: 2002,
  FILE_CREATED: 4000,
  FILE_MODIFIED: 4001,
  FILE_DELETED: 4002,
  FILE_ACCESS_DENIED: 4003,
  ERROR_GENERIC: 9000,
  ERROR_FILE_NOT_FOUND: 9001,
  ERROR_PERMISSION: 9002,
  ERROR_NETWORK: 9003,
};

export default {
  logError,
  logWarning,
  logInfo,
  formatError,
  handleApiError,
  withErrorHandling,
  handleComponentError,
  EventIds,
};
