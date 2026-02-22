import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Planning Radar - UK Planning Application Tracker',
  description: 'Track every UK planning application. Find opportunities before your competitors with powerful search and filtering tools.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}