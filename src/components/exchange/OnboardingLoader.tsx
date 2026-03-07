'use client'

import dynamic from 'next/dynamic'

const OnboardingFlow = dynamic(
  function () { return import('./OnboardingFlow').then(function (m) { return m.OnboardingFlow }) },
  { ssr: false }
)

export function OnboardingLoader() {
  return <OnboardingFlow />
}
