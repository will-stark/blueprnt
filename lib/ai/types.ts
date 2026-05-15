// Shared types for the AI generation pipeline

export type RequestKind =
  | 'new_blueprint'    // no chatId — first generation
  | 'edit_blueprint'   // chatId present — follow-up
  | 'regenerate'       // isRegenerate flag — branch on existing message
  | 'off_topic'        // blocked by classifier

export type Platform = 'farcaster' | 'generic'

export interface ClassifyResult {
  kind: RequestKind
  platform: Platform
  isSecondStrike: boolean // off_topic only — true if prior strike within window
}

export interface BlueprintContext {
  currentBlueprint: string | null // decrypted latest blueprint text
  originalUserMessage: string | null // for regenerate: the prompt that produced the AI msg
}

export interface PromptPayload {
  system: string
  user: string
}

export interface ValidationResult {
  valid: boolean
  missing: string[] // section headings that are absent
  reason?: string
}

// What the generate route receives from the client
export interface GenerateRequestBody {
  userType: 'farcaster' | 'privy' | 'anonymous'
  message: string
  identityId?: string
  chatId?: string
  isRegenerate?: boolean
  messageId?: string        // AI message ID to branch on (regenerate only)
  anonymousId?: string
  // Branch context — which version the user is currently viewing
  activeBlueprintMessageId?: string
  activeBranchIndex?: number
}
