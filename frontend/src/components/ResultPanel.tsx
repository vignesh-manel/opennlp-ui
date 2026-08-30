import { useEffect } from 'react'
import type { AnalysisResponse, ActiveTab, FeatureConfig } from '../types'
import { getPosColor, getEntityColor } from '../types'
import AnnotatedText from './AnnotatedText'

interface Props {
  result: AnalysisResponse
  activeTab: ActiveTab
  onTabChange: (tab: ActiveTab) => void
  features: FeatureConfig
}

interface TabDef {
  id: ActiveTab
  label: string
}

function getVisibleTabs(features: FeatureConfig): TabDef[] {
  const tabs: TabDef[] = [{ id: 'annotated', label: 'Annotated Text' }]
  if (features.tokenization.enabled)      tabs.push({ id: 'tokens',   label: 'Tokens & POS' })
  if (features.ner.enabled)               tabs.push({ id: 'entities', label: 'Entities' })
  if (features.languageDetection.enabled) tabs.push({ id: 'language', label: 'Language' })
  tabs.push({ id: 'raw', label: 'Raw JSON' })
  return tabs
}

export default function ResultPanel({ result, activeTab, onTabChange, features }: Props) {
  const visibleTabs = getVisibleTabs(features)

  // If the current tab was hidden (feature toggled off), fall back to Annotated Text
  useEffect(() => {
    if (!visibleTabs.find(t => t.id === activeTab)) {
      onTabChange('annotated')
    }
  }, [visibleTabs.map(t => t.id).join(','), activeTab])

  return (
    <div className="flex flex-col h-full">
      {/* Error banner */}
      {result.errors.length > 0 && (
        <div className="mx-4 mt-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
          <strong>Warnings:</strong>
          <ul className="mt-1 list-disc list-inside">
            {result.errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      {/* Tabs — only features that are enabled */}
      <div className="flex border-b border-gray-200 px-4 mt-3 gap-1">
        {visibleTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`text-xs px-3 py-2 rounded-t-lg font-medium transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'border-[#832778] text-[#832778] bg-purple-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {tab.label}
            {tab.id === 'tokens' && result.tokens.length > 0 && (
              <span className="ml-1 text-[10px] bg-gray-100 text-gray-500 rounded-full px-1.5">
                {result.tokens.length}
              </span>
            )}
            {tab.id === 'entities' && result.entities.length > 0 && (
              <span className="ml-1 text-[10px] bg-orange-100 text-orange-600 rounded-full px-1.5">
                {result.entities.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto result-scroll">
        {activeTab === 'annotated' && <AnnotatedText result={result} />}
        {activeTab === 'tokens'    && <TokensTab result={result} />}
        {activeTab === 'entities'  && <EntitiesTab result={result} />}
        {activeTab === 'language'  && <LanguageTab result={result} />}
        {activeTab === 'raw'       && <RawJsonTab result={result} />}
      </div>
    </div>
  )
}

function TokensTab({ result }: { result: AnalysisResponse }) {
  if (!result.tokens.length) return <EmptyState message="No tokens available. Enable Tokenization." />
  return (
    <div className="p-4 flex flex-wrap gap-1.5">
      {result.tokens.map((token, i) => (
        <div key={i} className="flex flex-col items-center">
          {token.posTag && (
            <span className="text-[9px] font-bold leading-none mb-0.5"
                  style={{ color: getPosColor(token.posTag) }}>
              {token.posTag}
            </span>
          )}
          <span className="px-2 py-1 text-sm bg-gray-100 rounded border border-gray-200 font-mono">
            {token.text}
          </span>
          <span className="text-[9px] text-gray-400 mt-0.5">{token.start}–{token.end}</span>
        </div>
      ))}
    </div>
  )
}

function EntitiesTab({ result }: { result: AnalysisResponse }) {
  if (!result.entities.length) return <EmptyState message="No entities found. Enable NER and provide a model." />
  return (
    <div className="p-4 flex flex-col gap-2">
      {result.entities.map((entity, i) => {
        const c = getEntityColor(entity.type)
        return (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg border"
               style={{ background: c.bg, borderColor: c.border }}>
            <span className="text-xs font-bold px-2 py-0.5 rounded"
                  style={{ background: c.border, color: '#fff' }}>
              {entity.type.toUpperCase()}
            </span>
            <span className="font-semibold text-sm flex-1" style={{ color: '#111' }}>
              {entity.text}
            </span>
            <span className="text-xs text-gray-500">
              {(entity.confidence * 100).toFixed(1)}%
            </span>
            <span className="text-xs text-gray-400 font-mono">
              {entity.start}–{entity.end}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function LanguageTab({ result }: { result: AnalysisResponse }) {
  if (!result.language) return <EmptyState message="Language detection not enabled or no model provided." />
  const { language, confidence, topLanguages } = result.language
  // Normalize bars relative to the top candidate so they always fill meaningfully
  const topScore = topLanguages && topLanguages.length > 0 ? topLanguages[0].confidence : confidence
  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-4">
        <span className="text-4xl">🌍</span>
        <div>
          <div className="text-2xl font-bold text-green-800">{language}</div>
          <div className="text-sm text-green-600">{(confidence * 100).toFixed(2)}% confidence</div>
        </div>
      </div>

      {topLanguages && topLanguages.length > 1 && (
        <div>
          <p className="text-xs font-semibold text-gray-600 mb-2">Top candidates <span className="font-normal text-gray-400">(bars normalized to best match)</span></p>
          <div className="flex flex-col gap-1">
            {topLanguages.map((l, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs font-mono w-12 text-gray-600">{l.language}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div className="h-2 rounded-full bg-green-400 transition-all"
                       style={{ width: `${(l.confidence / topScore) * 100}%` }} />
                </div>
                <span className="text-xs text-gray-500 w-12 text-right">
                  {(l.confidence * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function RawJsonTab({ result }: { result: AnalysisResponse }) {
  return (
    <pre className="p-4 text-xs font-mono text-gray-700 overflow-x-auto bg-gray-50">
      {JSON.stringify(result, null, 2)}
    </pre>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-32 text-sm text-gray-400 italic p-4 text-center">
      {message}
    </div>
  )
}
