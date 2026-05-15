import type { ValidationResult } from './types'

// Accept em dash (—), en dash (–), hyphen (-), or colon (:) — model may vary
const SECTION_PATTERNS = [
  /^## Section 1\s*[—–:\-]/m,
  /^## Section 2\s*[—–:\-]/m,
  /^## Section 3\s*[—–:\-]/m,
  /^## Section 4\s*[—–:\-]/m,
  /^## Section 5\s*[—–:\-]/m,
]

const SECTION_LABELS = [
  '## Section 1 —',
  '## Section 2 —',
  '## Section 3 —',
  '## Section 4 —',
  '## Section 5 —',
]

// Section 5 structural checks — loose enough to survive model formatting variation.
// We verify a pricing table exists and cost markers are present rather than
// matching exact tier labels, which differ between Gemini and Groq output.
const SECTION5_TABLE_RE = /\|.+\|.+\|/m          // at least one markdown table row
const SECTION5_COST_RE  = /\$[\d,]|\/month|per month|usd|usdc/i  // any cost marker

export function validateBlueprint(text: string): ValidationResult {
  const missing: string[] = []
  const positions: number[] = []

  for (let i = 0; i < SECTION_PATTERNS.length; i++) {
    const match = SECTION_PATTERNS[i].exec(text)
    if (!match) {
      missing.push(SECTION_LABELS[i])
    } else {
      positions.push(match.index)
    }
  }

  if (missing.length > 0) {
    console.warn('[VALIDATE] Missing sections:', missing, '| Output prefix:', text.slice(0, 200))
    return { valid: false, missing, reason: 'Missing required section headings' }
  }

  // Verify sections are non-empty
  for (let i = 0; i < SECTION_PATTERNS.length; i++) {
    const start = positions[i]
    const headingEnd = text.indexOf('\n', start)
    const contentStart = headingEnd === -1 ? start : headingEnd + 1
    const contentEnd = i + 1 < SECTION_PATTERNS.length ? positions[i + 1] : text.length

    const sectionContent = text.slice(contentStart, contentEnd).trim()
    if (sectionContent.length < 20) {
      return {
        valid: false,
        missing: [SECTION_LABELS[i]],
        reason: `Section ${i + 1} appears empty`,
      }
    }
  }

  // Section 5 must contain a pricing table and at least one cost marker
  const section5Start = positions[4]
  const section5Content = text.slice(section5Start)

  if (!SECTION5_TABLE_RE.test(section5Content)) {
    console.warn('[VALIDATE] Section 5 missing pricing table | preview:', section5Content.slice(0, 300))
    return { valid: false, missing: ['Section 5 pricing table'], reason: 'Section 5 is missing a pricing table' }
  }

  if (!SECTION5_COST_RE.test(section5Content)) {
    console.warn('[VALIDATE] Section 5 missing cost markers | preview:', section5Content.slice(0, 300))
    return { valid: false, missing: ['Section 5 cost markers'], reason: 'Section 5 has no cost figures' }
  }

  return { valid: true, missing: [] }
}
