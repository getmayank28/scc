// FeatureFlagContext.tsx
'use client'

import { FeatureFlagsTypes } from '@/types/featureFlags'
import React, { createContext, useContext } from 'react'

const FeatureFlagContext = createContext<FeatureFlagsTypes | null>(null)

export function FeatureFlagProvider({
  flags,
  children,
}: {
  flags: FeatureFlagsTypes
  children: React.ReactNode
}) {
  return (
    <FeatureFlagContext.Provider value={flags}>
      {children}
    </FeatureFlagContext.Provider>
  )
}

export function useFeatureFlag<K extends keyof FeatureFlagsTypes>(key: K) {
  const context = useContext(FeatureFlagContext)

  if (!context) {
    throw new Error('useFeatureFlag must be used within FeatureFlagProvider')
  }

  return context[key]
}
