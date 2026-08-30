import { useState, useRef, useEffect, useCallback } from 'react'
import Header from './components/Header'
import TextInput from './components/TextInput'
import ModelConfig from './components/ModelConfig'
import ResultPanel from './components/ResultPanel'
import { analyze } from './api/client'
import type { FeatureConfig, AnalysisResponse, ActiveTab } from './types'

const DEFAULT_FEATURES: FeatureConfig = {
  sentenceDetection: { enabled: true,  modelPath: '' },
  tokenization:      { enabled: true,  modelPath: '' },
  posTagging:        { enabled: false, modelPath: '' },
  ner:               { enabled: false, modelPath: '' },
  languageDetection: { enabled: false, modelPath: '' },
}

export default function App() {
  const [text, setText] = useState('')
  const [features, setFeatures] = useState<FeatureConfig>(DEFAULT_FEATURES)
  const [result, setResult] = useState<AnalysisResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<ActiveTab>('annotated')

  // ── Resizable sidebar ──────────────────────────────────────────────────────
  const [sidebarWidth, setSidebarWidth] = useState(320)
  const dragState = useRef({ active: false, startX: 0, startWidth: 320 })

  const onDividerMouseDown = useCallback((e: React.MouseEvent) => {
    dragState.current = { active: true, startX: e.clientX, startWidth: sidebarWidth }
    e.preventDefault()
  }, [sidebarWidth])

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!dragState.current.active) return
      const delta = e.clientX - dragState.current.startX
      setSidebarWidth(Math.max(220, Math.min(520, dragState.current.startWidth + delta)))
    }
    function onMouseUp() { dragState.current.active = false }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  async function handleAnalyze() {
    if (!text.trim()) return
    setLoading(true)
    setError(null)
    try {
      const response = await analyze({ text, features })
      setResult(response)
      // Auto-switch to the most interesting available tab
      if (response.entities.length > 0) setActiveTab('entities')
      else if (response.tokens.some(t => t.posTag)) setActiveTab('annotated')
      else setActiveTab('annotated')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        {/* Resizable left sidebar */}
        <aside
          className="flex-shrink-0 border-r border-gray-200 bg-white flex flex-col overflow-y-auto result-scroll"
          style={{ width: sidebarWidth }}
        >
          <div className="p-4 flex flex-col gap-5">
            <TextInput
              value={text}
              onChange={setText}
              onAnalyze={handleAnalyze}
              loading={loading}
            />
            <div className="border-t border-gray-100 pt-4">
              <ModelConfig config={features} onChange={setFeatures} />
            </div>
          </div>
        </aside>

        {/* Drag handle */}
        <div
          onMouseDown={onDividerMouseDown}
          className="w-1.5 flex-shrink-0 cursor-col-resize group flex items-center justify-center bg-gray-100 hover:bg-purple-100 transition-colors"
          title="Drag to resize"
        >
          <div className="w-0.5 h-8 rounded-full bg-gray-300 group-hover:bg-[#832778] transition-colors" />
        </div>

        {/* Main area: results */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {error && (
            <div className="m-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <strong>Error:</strong> {error}
            </div>
          )}

          {!result && !loading && (
            <div className="flex flex-col items-center justify-center flex-1 text-center px-8 gap-4">
              <div className="text-5xl">🔬</div>
              <h2 className="text-xl font-semibold text-gray-700">
                OpenNLP Local Developer Tool
              </h2>
              <p className="text-sm text-gray-500 max-w-md leading-relaxed">
                Enter text on the left, configure your model files, and click <strong>Analyze</strong>{' '}
                to visualize NLP pipeline results. All processing happens on your machine.
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mt-2 max-w-sm">
                {[
                  ['🔤', 'Tokenization'],
                  ['📝', 'Sentence Detection'],
                  ['🏷️', 'POS Tagging'],
                  ['🔍', 'Named Entity Recognition'],
                  ['🌍', 'Language Detection'],
                  ['🧠', 'Custom Models'],
                ].map(([icon, label]) => (
                  <div key={label} className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-3 py-2">
                    <span>{icon}</span><span>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center flex-1 gap-3 text-gray-500">
              <svg className="animate-spin h-5 w-5 text-[#832778]" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              <span className="text-sm">Running analysis…</span>
            </div>
          )}

          {result && !loading && (
            <ResultPanel
              result={result}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              features={features}
            />
          )}
        </main>
      </div>
    </div>
  )
}
