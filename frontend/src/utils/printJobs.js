const PRINT_JOBS_KEY = 'jez_print_jobs'

const safeParse = (raw) => {
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export const readPrintJobs = () => {
  if (typeof window === 'undefined') return []
  return safeParse(window.localStorage.getItem(PRINT_JOBS_KEY))
}

export const writePrintJobs = (jobs) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(PRINT_JOBS_KEY, JSON.stringify(jobs))
}

export const enqueuePrintJob = (jobData) => {
  const timestamp = jobData.timestamp || new Date().toISOString()
  const job = {
    id: jobData.id || `job-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    status: jobData.status || 'queued',
    ...jobData,
    timestamp
  }

  const jobs = readPrintJobs()
  jobs.push(job)
  writePrintJobs(jobs.slice(-200))
  return job
}

export const updatePrintJobStatus = (jobId, status) => {
  const jobs = readPrintJobs()
  const next = jobs.map((job) => (job.id === jobId ? { ...job, status } : job))
  writePrintJobs(next)
}
