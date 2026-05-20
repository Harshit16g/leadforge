import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/components/providers/ThemeProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LeadForge | HSR Motors',
  description: 'The operating system for automotive lead conversion.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            {children}
            <Toaster position="top-right" richColors />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
