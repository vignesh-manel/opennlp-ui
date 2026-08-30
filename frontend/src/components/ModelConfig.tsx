import { useState } from 'react'
import type { FeatureConfig, ModelFeature } from '../types'
import { browse } from '../api/client'
import type { BrowseResponse } from '../types'

interface Props {
  config: FeatureConfig
  onChange: (config: FeatureConfig) => void
}

// ─── Feature group definitions ─────────────────────────────────────────────
// Add a new group here when introducing a new feature category.

const GROUPS: Array<{
  id: string
  label: string
  features: Array<{ key: keyof FeatureConfig; label: string; color: string }>
  defaultOpen: boolean
}> = [
  {
    id: 'pipeline',
    label: 'Pipeline',
    defaultOpen: true,
    features: [
      { key: 'sentenceDetection', label: 'Sentence Detection', color: '#832778' },
      { key: 'tokenization',      label: 'Tokenization',       color: '#BE2043' },
    ],
  },
  {
    id: 'tagging',
    label: 'Tagging',
    defaultOpen: false,
    features: [
      { key: 'posTagging', label: 'POS Tagging',        color: '#E56b28' },
      { key: 'ner',        label: 'Named Entity (NER)', color: '#F59523' },
    ],
  },
  {
    id: 'classification',
    label: 'Classification',
    defaultOpen: false,
    features: [
      { key: 'languageDetection', label: 'Language Detection', color: '#059669' },
    ],
  },
]

export default function ModelConfig({ config, onChange }: Props) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(
    Object.fromEntries(GROUPS.map(g => [g.id, g.defaultOpen]))
  )
  const [browser, setBrowser] = useState<{ key: keyof FeatureConfig; data: BrowseResponse } | null>(null)
  const [browseError, setBrowseError] = useState<string | null>(null)

  function update(key: keyof FeatureConfig, patch: Partial<ModelFeature>) {
    onChange({ ...config, [key]: { ...config[key], ...patch } })
  }

  function toggleGroup(id: string) {
    setOpenGroups(prev => ({ ...prev, [id]: !prev[id] }))
  }

  async function openBrowser(key: keyof FeatureConfig) {
    setBrowseError(null)
    try {
      const mp = config[key].modelPath || ''
      let dir: string | undefined
      if (mp.endsWith('.bin') && mp.includes('/')) {
        dir = mp.substring(0, mp.lastIndexOf('/')) || undefined
      } else {
        dir = mp || undefined
      }
      const data = await browse(dir)
      setBrowser({ key, data })
    } catch {
      setBrowseError('Could not browse filesystem')
    }
  }

  async function navigate(dir: string) {
    if (!browser) return
    try {
      const data = await browse(dir)
      setBrowser({ key: browser.key, data })
    } catch {
      setBrowseError('Could not open directory')
    }
  }

  function selectFile(path: string) {
    if (!browser) return
    update(browser.key, { modelPath: path })
    setBrowser(null)
  }

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold text-gray-700">Model Configuration</h2>
      <p className="text-xs text-gray-500 mb-1">
        Point each feature to a <span className="font-mono">.bin</span> model file.
        Leave blank to use built-in fallbacks where available.
      </p>

      {GROUPS.map(group => {
        const activeCount = group.features.filter(f => config[f.key].enabled).length
        const isOpen = openGroups[group.id]

        return (
          <div key={group.id} className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Group header */}
            <button
              onClick={() => toggleGroup(group.id)}
              className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                {group.label}
              </span>
              <div className="flex items-center gap-1.5">
                {activeCount > 0 && (
                  <span className="text-[10px] bg-green-100 text-green-700 rounded-full px-1.5 py-0.5 font-medium">
                    {activeCount} on
                  </span>
                )}
                <svg
                  className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* Group body */}
            {isOpen && (
              <div className="p-2 flex flex-col gap-2 bg-white">
                {group.features.map(({ key, label, color }) => (
                  <div key={key} className="border border-gray-100 rounded-md p-2.5">
                    <div className="flex items-center gap-2 mb-2">
                      <button
                        onClick={() => update(key, { enabled: !config[key].enabled })}
                        aria-pressed={config[key].enabled}
                        className={`relative inline-flex w-9 h-5 flex-shrink-0 rounded-full transition-colors focus:outline-none ${
                          config[key].enabled ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                          config[key].enabled ? 'translate-x-4' : 'translate-x-0'
                        }`} />
                      </button>
                      <span className="text-xs font-medium leading-none" style={{ color }}>
                        {label}
                      </span>
                    </div>

                    {config[key].enabled && (
                      <div className="flex gap-1">
                        <input
                          type="text"
                          value={config[key].modelPath}
                          onChange={e => update(key, { modelPath: e.target.value })}
                          placeholder="/path/to/model.bin"
                          className="flex-1 text-xs px-2 py-1.5 border border-gray-200 rounded font-mono
                                     focus:outline-none focus:ring-1 focus:ring-purple-400"
                        />
                        <button
                          onClick={() => openBrowser(key)}
                          title="Browse for model file"
                          className="px-2 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 border border-gray-200
                                     rounded transition-colors text-gray-600"
                        >
                          📂
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {browseError && <p className="text-xs text-red-500">{browseError}</p>}

      {/* File browser modal */}
      {browser && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[70vh] flex flex-col">
            <div className="flex items-start justify-between px-4 py-3 border-b gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-700">Select Model File</p>
                <p className="text-xs text-gray-400 font-mono mt-0.5 truncate"
                   title={browser.data.currentPath}>
                  {shortPath(browser.data.currentPath)}
                </p>
              </div>
              <button onClick={() => setBrowser(null)}
                      className="text-gray-400 hover:text-gray-600 text-xl leading-none flex-shrink-0 mt-0.5">
                ×
              </button>
            </div>

            <div className="overflow-y-auto flex-1 result-scroll">
              {browser.data.parentPath && (
                <button
                  onClick={() => navigate(browser.data.parentPath!)}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 text-blue-600 border-b border-gray-100 flex items-center gap-2"
                >
                  <span>↑</span>
                  <span className="font-mono text-xs">..</span>
                </button>
              )}
              {browser.data.entries.map(entry => (
                <button
                  key={entry.path}
                  onClick={() => entry.isDirectory ? navigate(entry.path) : selectFile(entry.path)}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 border-b border-gray-50
                             flex items-center gap-2 transition-colors"
                >
                  <span className="text-base">{entry.isDirectory ? '📁' : '🧠'}</span>
                  <span className={`flex-1 ${entry.isDirectory ? 'text-gray-700' : 'text-gray-900 font-medium'}`}>
                    {entry.name}
                  </span>
                  {!entry.isDirectory && (
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {(entry.sizeBytes / 1024 / 1024).toFixed(1)} MB
                    </span>
                  )}
                </button>
              ))}
              {browser.data.entries.length === 0 && (
                <p className="text-sm text-gray-400 px-4 py-6 text-center">No .bin files found in this directory</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function shortPath(p: string): string {
  const parts = p.replace(/\/$/, '').split('/').filter(Boolean)
  if (parts.length <= 2) return p
  return '…/' + parts.slice(-2).join('/')
}

