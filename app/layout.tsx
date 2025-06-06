import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Poppins } from 'next/font/google'
import { Providers } from './providers'
import { Toaster } from 'react-hot-toast'

const poppins = Poppins({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('http://localhost:3000'),
  title: 'SaveYourProofs - Decentralized Freelancer Portfolio',
  description: 'Immutable proof-of-work logging for freelancers. Connect your wallet, submit work evidence, get client endorsements. All secured on blockchain.',
  keywords: ['web3', 'freelancer', 'blockchain', 'proof-of-work', 'solana', 'ethereum', 'ipfs', 'decentralized'],
  authors: [{ name: 'SaveYourProofs Team' }],
  openGraph: {
    title: 'SaveYourProofs - Decentralized Freelancer Portfolio',
    description: 'Immutable proof-of-work logging for freelancers powered by blockchain',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SaveYourProofs - Decentralized Freelancer Portfolio',
    description: 'Immutable proof-of-work logging for freelancers powered by blockchain',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#8b5cf6',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={`${poppins.className} min-h-screen bg-dark-900 text-sm antialiased`}>
        <Providers>
          <div className="relative min-h-screen">
            {/* Background effects */}
            <div className="fixed inset-0 bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 -z-10" />
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(139,92,246,0.05),transparent)] -z-10" />
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(168,139,250,0.03),transparent)] -z-10" />
            
            {/* Content */}
            {children}
            
            {/* Global toast notifications */}
            <Toaster
              position="bottom-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'rgba(26, 26, 29, 0.95)',
                  color: 'white',
                  border: '1px solid rgba(168, 139, 250, 0.3)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  backdropFilter: 'blur(8px)',
                  fontFamily: 'Poppins, sans-serif',
                },
                success: {
                  iconTheme: {
                    primary: '#10B981',
                    secondary: 'white',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#EF4444',
                    secondary: 'white',
                  },
                },
              }}
            />
          </div>
        </Providers>
      </body>
    </html>
  )
} 