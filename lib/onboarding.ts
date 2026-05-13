// Onboarding visibility and per-user-type slide content

export type OnboardingUserType = 'farcaster' | 'privy' | 'anonymous'

export function shouldShowOnboarding(
  userType: OnboardingUserType,
  userId?: string
): boolean {
  if (typeof window === 'undefined') return false

  if (userType === 'anonymous') {
    return !localStorage.getItem('blueprnt-anon-onboarding-seen')
  }

  if (userId) {
    return !localStorage.getItem(`blueprnt-${userType}-onboarding-${userId}-seen`)
  }

  return false
}

export function markOnboardingSeen(userType: OnboardingUserType, userId?: string) {
  if (typeof window === 'undefined') return

  if (userType === 'anonymous') {
    localStorage.setItem('blueprnt-anon-onboarding-seen', 'true')
  } else if (userId) {
    localStorage.setItem(`blueprnt-${userType}-onboarding-${userId}-seen`, 'true')
  }
}

export function getSlide4Content(userType: OnboardingUserType): string {
  switch (userType) {
    case 'farcaster':
      return 'All payments in USDC on Base. You get 3 free blueprints to start. After that, a single blueprint costs just $0.50.'
    case 'privy':
      return 'You get 3 free blueprints to start. After that, a single blueprint costs just $0.50. Pay with USDC on Base.'
    case 'anonymous':
      return 'You get 1 free blueprint to try. Create an account for 3 more free blueprints. After that, a single blueprint costs just $0.50.'
  }
}
