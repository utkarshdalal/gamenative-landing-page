import type React from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Compatibility - GameNative',
  description:
    'Search community compatibility reports to see if your game will work on your device using GameNative or Winlator. Filter by game, GPU and rating.',
  alternates: { canonical: '/compatibility/' },
}

export default function CompatibilityLayout({ children }: { children: React.ReactNode }) {
  return children
}
