import type { AnalysisResponse } from '../types'
import { getEntityColor, getPosColor } from '../types'

interface Props {
  result: AnalysisResponse
}

// ─── Annotation registry types ────────────────────────────────────────────────
// To add a new annotation type: add a layer in buildLayers(). Nothing else changes.

export interface AnnotationSpan {
  start: number
  end: number
  label: string
  style: 'highlight' | 'superscript' | 'boundary'  // 'bracket' | 'subscript' can be added later
  colors: { bg: string; border: string; text: string }
  tooltip?: string
}

export interface AnnotationLayer {
  id: string
  priority: number
  spans: AnnotationSpan[]
}

/** Registry — add a new entry here to introduce a new annotation type. */
function buildLayers(result: AnalysisResponse): AnnotationLayer[] {
  const layers: AnnotationLayer[] = []

  if (result.entities.length) {
    layers.push({
      id: 'entity', priority: 10,
      spans: result.entities.map(e => ({
        start: e.start, end: e.end,
        label: e.type.toUpperCase(),
        style: 'highlight' as const,
        colors: getEntityColor(e.type),
        tooltip: `${e.type.toUpperCase()} — ${(e.confidence * 100).toFixed(0)}% confidence`,
      })),
    })
  }

  if (result.tokens.some(t => t.posTag)) {
    layers.push({
      id: 'pos', priority: 5,
      spans: result.tokens.filter(t => t.posTag).map(t => ({
        start: t.start, end: t.end,
        label: t.posTag!,
        style: 'superscript' as const,
        colors: { bg: 'transparent', border: 'transparent', text: getPosColor(t.posTag!) },
      })),
    })
  }

  // Fallback: when only tokenization ran (no POS, no NER), show token boundaries
  // so the Annotated Text tab is never empty after a successful analysis.
  if (result.tokens.length && !result.entities.length && !result.tokens.some(t => t.posTag)) {
    layers.push({
      id: 'token-boundary', priority: 1,
      spans: result.tokens.map(t => ({
        start: t.start, end: t.end,
        label: '',
        style: 'boundary' as const,
        colors: { bg: '#f3f4f6', border: '#d1d5db', text: '' },
        tooltip: `token [${t.start}–${t.end}]`,
      })),
    })
  }

  return layers
}

// ─── Generic segment builder ───────────────────────────────────────────────────

interface Segment {
  text: string
  highlight?: { label: string; colors: AnnotationSpan['colors']; tooltip?: string }
  superscript?: { label: string; color: string }
}

function buildSegments(text: string, layers: AnnotationLayer[]): Segment[] {
  // 1. Extract highlight+boundary spans, resolve overlaps by priority (higher wins)
  const highlights = layers
    .flatMap(l => l.spans.filter(s => s.style === 'highlight' || s.style === 'boundary').map(s => ({ ...s, priority: l.priority })))
    .sort((a, b) => b.priority - a.priority || a.start - b.start)

  const resolvedHighlights: typeof highlights = []
  for (const h of highlights) {
    if (!resolvedHighlights.some(r => h.start < r.end && h.end > r.start)) {
      resolvedHighlights.push(h)
    }
  }
  resolvedHighlights.sort((a, b) => a.start - b.start)

  // 2. Extract superscript spans; those inside a highlight span are suppressed
  const superscripts = layers
    .flatMap(l => l.spans.filter(s => s.style === 'superscript'))
    .filter(s => !resolvedHighlights.some(h => s.start >= h.start && s.end <= h.end))

  // 3. Walk through the text, emit segments
  const segments: Segment[] = []
  let pos = 0

  for (const h of resolvedHighlights) {
    if (h.start < pos) continue
    if (h.start > pos) emitWithSuperscripts(text, pos, h.start, superscripts, segments)
    segments.push({
      text: text.slice(h.start, h.end),
      highlight: { label: h.label, colors: h.colors, tooltip: h.tooltip },
    })
    pos = h.end
  }
  if (pos < text.length) emitWithSuperscripts(text, pos, text.length, superscripts, segments)

  return segments
}

/** Slice [from, to) into sub-segments applying any superscript spans within that range. */
function emitWithSuperscripts(
  text: string, from: number, to: number,
  superscripts: AnnotationSpan[], out: Segment[],
) {
  const relevant = superscripts
    .filter(s => s.start >= from && s.end <= to)
    .sort((a, b) => a.start - b.start)

  let pos = from
  for (const s of relevant) {
    if (s.start > pos) out.push({ text: text.slice(pos, s.start) })
    out.push({ text: text.slice(s.start, s.end), superscript: { label: s.label, color: s.colors.text } })
    pos = s.end
  }
  if (pos < to) out.push({ text: text.slice(pos, to) })
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AnnotatedText({ result }: Props) {
  const { text, entities, sentences } = result

  const layers = buildLayers(result)
  if (!layers.length) {
    return <p className="text-sm text-gray-400 italic p-4">No annotations to display.</p>
  }

  const segments = buildSegments(text, layers)

  return (
    <div className="p-4">
      {/* Entity type legend */}
      {entities.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {[...new Set(entities.map(e => e.type))].map(type => {
            const c = getEntityColor(type)
            return (
              <span key={type} className="text-xs px-2 py-0.5 rounded-full font-semibold border"
                    style={{ background: c.bg, borderColor: c.border, color: c.text }}>
                {type.toUpperCase()}
              </span>
            )
          })}
        </div>
      )}

      {sentences.length > 1 && (
        <div className="mb-3 text-xs text-gray-500">{sentences.length} sentences detected</div>
      )}

      <div className="text-base leading-relaxed font-serif">
        {segments.map((seg, i) => {
          if (seg.highlight) {
            const { label, colors, tooltip } = seg.highlight
            // 'boundary' style: subtle token box, no label
            if (!label) {
              return (
                <span key={i} title={tooltip}
                      className="mx-px rounded px-0.5"
                      style={{ background: colors.bg, outline: `1px solid ${colors.border}` }}>
                  {seg.text}
                </span>
              )
            }
            return (
              <span key={i} title={tooltip}
                    className="annotation-span mx-0.5"
                    style={{ background: colors.bg, border: `1px solid ${colors.border}`, color: '#111' }}>
                {seg.text}
                <sup className="ml-0.5 text-[9px] font-bold px-0.5" style={{ color: colors.text }}>
                  {label}
                </sup>
              </span>
            )
          }
          if (seg.superscript) {
            return (
              <span key={i} className="mx-px">
                {seg.text}
                <sup className="ml-px text-[8px] font-bold" style={{ color: seg.superscript.color }}>
                  {seg.superscript.label}
                </sup>
              </span>
            )
          }
          return <span key={i}>{seg.text}</span>
        })}
      </div>
    </div>
  )
}

