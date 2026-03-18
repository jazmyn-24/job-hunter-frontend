const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const getJobs = async (sort = 'newest', limit = 50, offset = 0) => {
  const res = await fetch(`${API_URL}/api/jobs?sort=${sort}&limit=${limit}&offset=${offset}`)
  if (!res.ok) throw new Error('Failed')
  return res.json()
}

export const getStats = async () => {
  const res = await fetch(`${API_URL}/api/stats`)
  if (!res.ok) throw new Error('Failed')
  return res.json()
}

export const getPipelineStatus = async () => {
  const res = await fetch(`${API_URL}/api/pipeline/status`)
  if (!res.ok) throw new Error('Failed')
  return res.json()
}

export const getScoreQueue = async (limit = 3) => {
  const res = await fetch(`${API_URL}/api/jobs/queue?limit=${limit}`)
  if (!res.ok) throw new Error('Failed')
  return res.json()
}

export const triggerPipeline = async () => {
  const res = await fetch(`${API_URL}/api/pipeline/run`, { method: 'POST' })
  if (!res.ok) throw new Error('Failed')
  return res.json()
}
