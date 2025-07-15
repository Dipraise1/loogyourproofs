'use client';

import Image from 'next/image';

export default function TestLogoPage() {
  return (
    <div className="min-h-screen bg-black p-8">
      <h1 className="text-white text-2xl mb-8">Logo Test Page</h1>
      
      <div className="space-y-8">
        <div>
          <h2 className="text-white mb-4">Regular img tag:</h2>
          <img 
            src="/icon.png" 
            alt="Test Logo Regular" 
            className="w-16 h-16 border border-white"
            onLoad={() => console.log('Regular img loaded')}
            onError={(e) => console.error('Regular img failed:', e)}
          />
        </div>
        
        <div>
          <h2 className="text-white mb-4">Next.js Image component:</h2>
          <Image 
            src="/icon.png" 
            alt="Test Logo Next" 
            width={64}
            height={64}
            className="border border-white"
            onLoad={() => console.log('Next Image loaded')}
            onError={(e) => console.error('Next Image failed:', e)}
            unoptimized
          />
        </div>
        
        <div>
          <h2 className="text-white mb-4">Same styling as header:</h2>
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-purple-600/20 border border-purple-500/30 relative">
            <Image 
              src="/icon.png" 
              alt="Test Logo Header Style" 
              width={40}
              height={40}
              className="w-full h-full object-contain"
              onLoad={() => console.log('Header style loaded')}
              onError={(e) => console.error('Header style failed:', e)}
              unoptimized
            />
          </div>
        </div>
      </div>
    </div>
  );
} 