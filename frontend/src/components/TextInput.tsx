interface Props {
  value: string
  onChange: (text: string) => void
  onAnalyze: () => void
  loading: boolean
}

const SAMPLE_TEXTS = [
  "Barack Obama visited Paris last Tuesday. He met with French President Emmanuel Macron at the Élysée Palace.",
  "Apple Inc. announced its new iPhone 16 in Cupertino, California. CEO Tim Cook called it the most advanced smartphone ever.",
  "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.",
]

export default function TextInput({ value, onChange, onAnalyze, loading }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-gray-700">Input Text</label>
        <div className="flex gap-1">
          {SAMPLE_TEXTS.map((t, i) => (
            <button
              key={i}
              onClick={() => onChange(t)}
              className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-200 transition-colors"
            >
              Sample {i + 1}
            </button>
          ))}
        </div>
      </div>

      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Enter or paste text to analyze…"
        rows={5}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none
                   focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent
                   font-mono text-gray-800 placeholder-gray-400"
      />

      <button
        onClick={onAnalyze}
        disabled={loading || !value.trim()}
        className="w-full py-2.5 rounded-lg font-semibold text-white text-sm transition-all
                   disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ background: loading ? '#9ca3af' : '#832778' }}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            Analyzing…
          </span>
        ) : 'Analyze'}
      </button>
    </div>
  )
}
