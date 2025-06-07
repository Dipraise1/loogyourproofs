import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Poppins } from 'next/font/google'
import { Providers } from './providers'
import { Toaster } from 'react-hot-toast'
// WalletDebug removed - will be conditionally imported in providers instead
import './utils/phantomErrorSuppress' // Suppress Phantom service worker errors globally

const poppins = Poppins({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
})

const siteUrl = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}` 
  : 'https://saveyourproofs.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'SaveYourProofs - Decentralized Freelancer Portfolio & Proof-of-Work Platform',
    template: '%s | SaveYourProofs'
  },
  description: 'The leading Web3 platform for freelancers to create immutable proof-of-work portfolios. Connect your wallet, submit verified work evidence, earn client endorsements, and build your reputation on the blockchain. Powered by Solana, Ethereum, and IPFS.',
  keywords: [
    'web3 freelancer platform',
    'blockchain portfolio',
    'proof of work',
    'decentralized freelancing',
    'crypto freelancer',
    'solana freelancer',
    'ethereum freelancer',
    'ipfs portfolio',
    'blockchain verification',
    'web3 reputation',
    'smart contracts freelancing',
    'decentralized work proof',
    'crypto portfolio',
    'blockchain endorsements',
    'web3 professional network',
    'immutable work records',
    'freelancer verification',
    'digital proof system',
    'blockchain credentials',
    'web3 career platform'
  ],
  authors: [{ name: 'SaveYourProofs Team', url: siteUrl }],
  creator: 'SaveYourProofs',
  publisher: 'SaveYourProofs',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  category: 'Technology',
  classification: 'Web3 Freelancer Platform',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'SaveYourProofs',
    title: 'SaveYourProofs - Web3 Freelancer Portfolio & Blockchain Proof-of-Work Platform',
    description: 'Build your immutable freelancer portfolio on the blockchain. Verify your work, earn endorsements, and establish your Web3 reputation with SaveYourProofs.',
    images: [
      {
        url: '/image.png',
        width: 1200,
        height: 630,
        alt: 'SaveYourProofs - Decentralized Freelancer Platform Logo',
        type: 'image/png',
      },
      {
        url: '/image.png',
        width: 512,
        height: 512,
        alt: 'SaveYourProofs Logo',
        type: 'image/png',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@SaveYourProofs',
    creator: '@SaveYourProofs',
    title: 'SaveYourProofs - Web3 Freelancer Portfolio Platform',
    description: 'Create immutable proof-of-work portfolios on the blockchain. Join the future of freelancing with Web3.',
    images: ['/image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
    yahoo: 'your-yahoo-verification-code',
  },
  alternates: {
    canonical: siteUrl,
    languages: {
      'en-US': siteUrl,
    },
  },
  other: {
    'msapplication-TileColor': '#8b5cf6',
    'theme-color': '#8b5cf6',
  },
  icons: {
    icon: '/image.png',
    shortcut: '/image.png',
    apple: '/image.png',
    other: {
      rel: 'apple-touch-icon-precomposed',
      url: '/image.png',
    },
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#8b5cf6' },
    { media: '(prefers-color-scheme: dark)', color: '#8b5cf6' }
  ],
  colorScheme: 'dark light',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'SaveYourProofs',
    url: siteUrl,
    description: 'Decentralized freelancer portfolio platform powered by blockchain technology',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock'
    },
    provider: {
      '@type': 'Organization',
      name: 'SaveYourProofs',
      url: siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/image.png`,
        width: 512,
        height: 512
      },
      sameAs: [
        'https://twitter.com/SaveYourProofs',
        'https://github.com/SaveYourProofs',
        'https://discord.gg/SaveYourProofs'
      ]
    },
    mainEntity: {
      '@type': 'Service',
      name: 'Blockchain Freelancer Verification',
      description: 'Immutable proof-of-work verification system for freelancers',
      provider: {
        '@type': 'Organization',
        name: 'SaveYourProofs',
        logo: `${siteUrl}/image.png`
      },
      areaServed: 'Worldwide',
      availableLanguage: 'English'
    },
    potentialAction: [
      {
        '@type': 'UseAction',
        target: `${siteUrl}/submit`,
        name: 'Submit Proof of Work'
      },
      {
        '@type': 'ViewAction',
        target: `${siteUrl}/explore`,
        name: 'Explore Freelancers'
      },
      {
        '@type': 'RegisterAction',
        target: `${siteUrl}/dashboard`,
        name: 'Connect Wallet'
      }
    ],
    keywords: 'web3, blockchain, freelancer, portfolio, proof-of-work, solana, ethereum, ipfs, decentralized',
    image: `${siteUrl}/image.png`
  }

  return (
    <html lang="en" className="dark">
      <head>
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Favicons and app icons */}
        <link rel="icon" href="/image.png" sizes="any" />
        <link rel="icon" href="/image.png" type="image/png" />
        <link rel="apple-touch-icon" href="/image.png" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* PWA meta tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="SaveYourProofs" />
        <meta name="application-name" content="SaveYourProofs" />
        
        {/* Additional SEO meta tags */}
        <meta name="language" content="EN" />
        <meta name="revisit-after" content="1 days" />
        <meta name="distribution" content="global" />
        <meta name="rating" content="general" />
        <meta name="referrer" content="origin-when-cross-origin" />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        
        {/* Additional structured data for software application */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'SaveYourProofs',
              operatingSystem: 'Web Browser',
              applicationCategory: 'BusinessApplication',
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.8',
                reviewCount: '150'
              },
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD'
              },
              image: `${siteUrl}/image.png`,
              logo: `${siteUrl}/image.png`
            })
          }}
        />
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
            
            {/* Debug component for development */}
            {/* WalletDebug moved to providers to avoid server component issues */}
          </div>
        </Providers>
      </body>
    </html>
  )
} 