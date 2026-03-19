const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const getJobs = async (sort = 'newest', limit = 50, offset = 0, term = 'fall2026', jobType = 'all') => {
  const res = await fetch(`${API_URL}/api/jobs?sort=${sort}&limit=${limit}&offset=${offset}&term=${term}&type=${jobType}`)
  if (!res.ok) throw new Error('Failed')
  return res.json()
}

export const getJobDescription = async (jobId) => {
  const res = await fetch(`${API_URL}/api/jobs/${jobId}/description`)
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

export const saveProfile = async (sessionId, profileData) => {
  const res = await fetch(`${API_URL}/api/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, ...profileData }),
  })
  if (!res.ok) throw new Error('Failed to save profile')
  return res.json()
}

export const runScorer = async (sessionId) => {
  const res = await fetch(`${API_URL}/api/score/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId }),
  })
  if (!res.ok) throw new Error('Failed to run scorer')
  return res.json()
}

export const getScorerStatus = async () => {
  const res = await fetch(`${API_URL}/api/score/status`)
  if (!res.ok) throw new Error('Failed')
  return res.json()
}

export const getCVs = async (sessionId) => {
  const res = await fetch(`${API_URL}/api/cvs/${sessionId}`)
  if (!res.ok) throw new Error('Failed')
  return res.json()
}

export const addCV = async (sessionId, cvData) => {
  const res = await fetch(`${API_URL}/api/cvs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, ...cvData }),
  })
  if (!res.ok) throw new Error('Failed')
  return res.json()
}

export const updateCV = async (cvId, patch) => {
  const res = await fetch(`${API_URL}/api/cvs/${cvId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  })
  if (!res.ok) throw new Error('Failed')
  return res.json()
}

export const deleteCV = async (cvId) => {
  const res = await fetch(`${API_URL}/api/cvs/${cvId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed')
  return res.json()
}
