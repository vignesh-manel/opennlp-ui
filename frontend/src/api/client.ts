import type { AnalysisRequest, AnalysisResponse, BrowseResponse } from '../types'

const BASE = '/api'

export async function analyze(request: AnalysisRequest): Promise<AnalysisResponse> {
  const res = await fetch(`${BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error ?? 'Analysis failed')
  }
  return res.json()
}

export async function browse(dir?: string): Promise<BrowseResponse> {
  const params = dir ? `?dir=${encodeURIComponent(dir)}` : ''
  const res = await fetch(`${BASE}/browse${params}`)
  if (!res.ok) throw new Error('Could not browse directory')
  return res.json()
}
