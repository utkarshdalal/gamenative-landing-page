import type React from 'react'
import type { Metadata } from 'next'
import { Bricolage_Grotesque } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Suspense } from 'react'
import './globals.css'

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage',
})

export const metadata: Metadata = {
  title: 'GameNative - Play Steam, Epic & GOG Games on Android',
  description:
    'Play your favorite PC games from Steam, Epic and GOG directly on your phone or handheld—no cloud PCs, no subscriptions, no lag. Just your games, running locally.',
  keywords: 'GameNative, Steam, Epic, GOG, Android, gaming, mobile gaming, PC games, handheld',
  authors: [{ name: 'GameNative' }],
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`font-sans ${bricolage.variable} antialiased`}>
        <Suspense fallback={null}>{children}</Suspense>
        <Analytics />
      </body>
    </html>
  )
}
