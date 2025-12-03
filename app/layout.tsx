import type { Metadata } from 'next'
import './globals.css'
import { QueryProvider } from './providers/QueryProvider'

export const metadata: Metadata = {
  title: 'QAchatBot',
  description: 'QAchatBot',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='zh-CN'>
      <body className='antialiased'>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  )
}
