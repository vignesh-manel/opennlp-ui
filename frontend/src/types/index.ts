// Mirrors the Java DTOs exactly

export interface AnalysisRequest {
  text: string
  features: FeatureConfig
}

export interface FeatureConfig {
  sentenceDetection: ModelFeature
  tokenization: ModelFeature
  posTagging: ModelFeature
  ner: ModelFeature
  languageDetection: ModelFeature
}

export interface ModelFeature {
  enabled: boolean
  modelPath: string
}

export interface AnalysisResponse {
  text: string
  sentences: Sentence[]
  tokens: Token[]
  entities: Entity[]
  language: LanguageResult | null
  errors: string[]
}

export interface Sentence {
  start: number
  end: number
  text: string
}

export interface Token {
  start: number
  end: number
  text: string
  posTag: string | null
}

export interface Entity {
  start: number
  end: number
  text: string
  type: string
  confidence: number
}

export interface LanguageResult {
  language: string
  confidence: number
  topLanguages: LanguageResult[] | null
}

// File browser
export interface BrowseResponse {
  currentPath: string
  entries: FileEntry[]
  parentPath: string | null
}

export interface FileEntry {
  name: string
  path: string
  isDirectory: boolean
  sizeBytes: number
}

// UI state
export type ActiveTab = 'annotated' | 'tokens' | 'entities' | 'language' | 'raw'

export const ENTITY_COLORS: Record<string, { bg: string; border: string; text: string; label: string }> = {
  person:       { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af',  label: 'PERSON' },
  location:     { bg: '#dcfce7', border: '#22c55e', text: '#166534',  label: 'LOC' },
  organization: { bg: '#fef9c3', border: '#eab308', text: '#854d0e',  label: 'ORG' },
  date:         { bg: '#fce7f3', border: '#ec4899', text: '#9d174d',  label: 'DATE' },
  misc:         { bg: '#f3e8ff', border: '#a855f7', text: '#6b21a8',  label: 'MISC' },
  entity:       { bg: '#ffedd5', border: '#f97316', text: '#9a3412',  label: 'ENT' },
}

export function getEntityColor(type: string) {
  return ENTITY_COLORS[type.toLowerCase()] ?? ENTITY_COLORS['entity']
}

export const POS_COLORS: Record<string, string> = {
  NN: '#1d4ed8', NNS: '#1d4ed8', NNP: '#1e40af', NNPS: '#1e40af',      // nouns — blue
  VB: '#15803d', VBD: '#15803d', VBG: '#15803d', VBN: '#15803d',       // verbs — green
  VBP: '#15803d', VBZ: '#15803d',
  JJ: '#b45309', JJR: '#b45309', JJS: '#b45309',                        // adjectives — amber
  RB: '#7e22ce', RBR: '#7e22ce', RBS: '#7e22ce',                        // adverbs — purple
  DT: '#6b7280', IN: '#6b7280', CC: '#6b7280', TO: '#6b7280',           // function words — gray
  PRP: '#9d174d', 'PRP$': '#9d174d',                                     // pronouns — pink
  CD: '#065f46',                                                         // numbers — teal
}

export function getPosColor(tag: string): string {
  return POS_COLORS[tag] ?? '#374151'
}
