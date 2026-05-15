import type { ValidationResult } from './types'

// Prefix-match: model can use editorial titles ("## Section 1 — What This App Actually Is")
// while validation only checks for the section number anchor.
const SECTION_PREFIXES = [
  '## Section 1 —',
  '## Section 2 —',
  '## Section 3 —',
  '## Section 4 —',
  '## Section 5 —',
]

const COST_TIERS = ['Free / OSS', 'Indie Builder', 'At Scale']

function findSectionStart(text: string, prefix: string): number {
  return text.indexOf(prefix)
}

export function validateBlueprint(text: string): ValidationResult {
  const missing: string[] = []
  const positions: number[] = []

  for (const prefix of SECTION_PREFIXES) {
    const pos = findSectionStart(text, prefix)
    if (pos === -1) {
      missing.push(prefix)
    } else {
      positions.push(pos)
    }
  }

  if (missing.length > 0) {
    return { valid: false, missing, reason: 'Missing required section headings' }
  }

  // Verify sections are non-empty
  for (let i = 0; i < SECTION_PREFIXES.length; i++) {
    const start = positions[i]
    // Find end of this heading line (skip to after the newline)
    const headingEnd = text.indexOf('\n', start)
    const contentStart = headingEnd === -1 ? start : headingEnd + 1
    const contentEnd = i + 1 < SECTION_PREFIXES.length ? positions[i + 1] : text.length

    const sectionContent = text.slice(contentStart, contentEnd).trim()
    if (sectionContent.length < 20) {
      return {
        valid: false,
        missing: [SECTION_PREFIXES[i]],
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
