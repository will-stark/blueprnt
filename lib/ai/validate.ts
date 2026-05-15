import type { ValidationResult } from './types'

// Accept em dash (—), en dash (–), or regular hyphen (-) — model may vary
const SECTION_PATTERNS = [
  /^## Section 1\s*[—–-]/m,
  /^## Section 2\s*[—–-]/m,
  /^## Section 3\s*[—–-]/m,
  /^## Section 4\s*[—–-]/m,
  /^## Section 5\s*[—–-]/m,
]

const SECTION_LABELS = [
  '## Section 1 —',
  '## Section 2 —',
  '## Section 3 —',
  '## Section 4 —',
  '## Section 5 —',
]

const COST_TIERS = ['Free / OSS', 'Indie Builder', 'At Scale']

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

  // Section 5 must have all three cost tiers
  const section5Start = positions[4]
  const section5Content = text.slice(section5Start)
  const missingTiers = COST_TIERS.filter((tier) => !section5Content.includes(tier))

  if (missingTiers.length > 0) {
    return {
      valid: false,
      missing: missingTiers.map((t) => `Cost tier: ${t}`),
      reason: 'Section 5 is missing cost tiers',
    }
  }

  return { valid: true, missing: [] }
}
