import type { Metadata, Viewport } from 'next'
import { Inter, Space_Grotesk, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const grotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-display' })
const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:5320'

const title = 'Meridian — Global Economic Intelligence'
const description =
  'Explore the world economy on a living 3D globe — real World Bank data, live news, and AI briefings.'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  applicationName: 'Meridian',
  keywords: ['economic data', 'world bank', 'data visualization', '3d globe', 'market intelligence'],
  openGraph: {
    type: 'website',
    url: siteUrl,
    siteName: 'Meridian',
    title,
    description,
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
}

export const viewport: Viewport = {
  themeColor: '#04070c',
  colorScheme: 'dark',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${grotesk.variable} ${plexMono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
