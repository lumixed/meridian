import type { Metadata } from 'next'
import { Inter, Space_Grotesk, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const grotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-display' })
const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'Meridian — Global Economic Intelligence',
  description: 'Explore the world economy on a living 3D globe — real World Bank data, live news, and AI briefings.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${grotesk.variable} ${plexMono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
