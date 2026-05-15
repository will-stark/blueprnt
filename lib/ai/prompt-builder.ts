import type { BlueprintContext, Platform, PromptPayload, RequestKind } from './types'
import {
  coreIdentity,
  editModeRules,
  farcasterRules,
  newBlueprintClosing,
  outputStructure,
  regenerateRules,
  section1Rules,
  section2Rules,
  section3Rules,
  section4Rules,
  section5Rules,
  writingRules,
} from './prompt-modules'

export function buildPrompt(
  kind: RequestKind,
  platform: Platform,
  message: string,
  context: BlueprintContext,
): PromptPayload {
  const platformBlock = platform === 'farcaster' ? `\n\n${farcasterRules}` : ''

  if (kind === 'off_topic') {
    return {
      system: coreIdentity,
      user: message,
    }
  }

  if (kind === 'new_blueprint') {
    const system = [
      coreIdentity,
      outputStructure,
      writingRules,
      section1Rules,
      section2Rules,
      section3Rules,
      section4Rules,
      section5Rules,
      platformBlock,
    ]
      .filter(Boolean)
      .join('\n\n')

    return {
      system,
      user: message + newBlueprintClosing,
    }
  }

  if (kind === 'edit_blueprint') {
    const blueprint = context.currentBlueprint ?? ''
    const system = [
      coreIdentity,
      editModeRules,
      outputStructure,
      writingRules,
      section1Rules,
      section2Rules,
      section3Rules,
      section4Rules,
      section5Rules,
      platformBlock,
    ]
      .filter(Boolean)
      .join('\n\n')

    const user = `${message}\n\n---\n${blueprint}\n---`
    return { system, user }
  }

  if (kind === 'regenerate') {
    const blueprint = context.currentBlueprint ?? ''
    const originalMessage = context.originalUserMessage ?? message
    const system = [
      coreIdentity,
      regenerateRules,
      outputStructure,
      writingRules,
      section1Rules,
      section2Rules,
      section3Rules,
      section4Rules,
      section5Rules,
      platformBlock,
    ]
      .filter(Boolean)
      .join('\n\n')

    const user = `Original app idea: ${originalMessage}\n\nPrevious blueprint for reference:\n---\n${blueprint}\n---`
    return { system, user }
  }

  // Exhaustive — TypeScript will error if a new kind is added without handling it
  const _exhaustive: never = kind
  return _exhaustive
}
