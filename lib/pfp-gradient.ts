const COLOR_PAIRS: [string, string][] = [
  ['#3B82F6', '#8B5CF6'],
  ['#10B981', '#3B82F6'],
  ['#F59E0B', '#EF4444'],
  ['#EC4899', '#8B5CF6'],
  ['#6366F1', '#3B82F6'],
]

export function generateGradient(seed: string): string {
  const hash = seed.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  const [c1, c2] = COLOR_PAIRS[hash % COLOR_PAIRS.length]
  return `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`
}
