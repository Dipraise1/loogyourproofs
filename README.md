# SaveYourProofs - Decentralized Freelancer Portfolio

![SaveYourProofs](https://img.shields.io/badge/SaveYourProofs-v1.0.0-purple)
![Next.js](https://img.shields.io/badge/Next.js-14.0-black)
![Solana](https://img.shields.io/badge/Solana-Web3-green)
![IPFS](https://img.shields.io/badge/IPFS-Decentralized-blue)
![2025 Design](https://img.shields.io/badge/Design-2025%20Trends-pink)

A fully functional decentralized web application where freelancers can log immutable proof-of-work submissions. Built with modern 2025 design trends featuring dark themes, purple accents, small refined typography, and cutting-edge Web3 functionality.

## ✨ Features

### 🔐 **Web3 Wallet Integration**
- **Multi-wallet Support**: Phantom, MetaMask, Solflare, and more
- **Dual Blockchain**: Solana and Ethereum/EVM compatibility
- **Auto-connect**: Seamless wallet connection and reconnection

### 📝 **Proof Submission System**
- **Rich Content Upload**: Images, documents, GitHub links, live demos
- **IPFS Storage**: Immutable content storage with redundant gateways
- **Wallet Signatures**: Cryptographically signed proof submissions
- **Metadata Management**: Structured proof information with tags and categories

### 🏆 **Client Endorsement System**
- **Verifiable Endorsements**: On-chain client testimonials
- **Reputation Building**: Accumulated endorsements increase credibility
- **Transparent Reviews**: Public, immutable feedback system

### 🔍 **Discovery & Search**
- **Freelancer Exploration**: Browse verified freelancer portfolios
- **ENS/SNS Support**: Search by blockchain domain names
- **Advanced Filtering**: By skills, rating, endorsements, and more
- **Public Portfolios**: Transparent work history for all users

### 🎨 **2025 Design Aesthetics**
- **Dark Mode First**: Modern black backgrounds with purple accents
- **Micro Typography**: Small, refined text following 2025 trends
- **Glow Effects**: Sci-fi inspired UI with subtle animations
- **Glass Morphism**: Translucent panels and backdrop blur
- **Responsive Design**: Mobile-first with thumb-friendly navigation

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Web3 wallet (Phantom, MetaMask, etc.)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/saveyourproofs.git
cd saveyourproofs
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:
```env
# IPFS Configuration (Optional - uses public gateways as fallback)
NEXT_PUBLIC_INFURA_PROJECT_ID=your_infura_project_id
NEXT_PUBLIC_INFURA_PROJECT_SECRET=your_infura_secret

# Pinata (Alternative IPFS service)
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_API_KEY=your_pinata_secret

# Blockchain Configuration
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_ETHEREUM_NETWORK=sepolia
```

4. **Run the development server**
```bash
npm run dev
# or
yarn dev
```

5. **Open your browser**
Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 Usage Guide

### For Freelancers

1. **Connect Your Wallet**
   - Click "Connect Wallet" and choose your preferred Web3 wallet
   - Approve the connection request

2. **Submit Your First Proof**
   - Navigate to "Submit Proof" 
   - Fill in project details, description, and tags
   - Upload supporting files (images, documents, code)
   - Add GitHub repository or live demo links
   - Sign the transaction with your wallet

3. **Build Your Portfolio**
   - View all your submissions in the Dashboard
   - Track verification status and endorsements
   - Share your public portfolio link

### For Clients

1. **Explore Freelancers**
   - Browse the "Explore" page to discover talent
   - Search by skills, location, or ENS names
   - View detailed portfolios and work history

2. **Endorse Quality Work**
   - Connect your wallet as a client
   - Find the freelancer's work you want to endorse
   - Submit an on-chain endorsement with your feedback

## 🏗️ Architecture

### Frontend Stack
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling with custom 2025 design system
- **Framer Motion**: Smooth animations and transitions
- **Lucide React**: Modern icon library

### Web3 Integration
- **Solana Web3.js**: Solana blockchain interaction
- **Wallet Adapter**: Multi-wallet connection management
- **Ethers.js**: Ethereum blockchain integration (planned)

### Storage & Data
- **IPFS**: Decentralized file storage
- **Pinata/Infura**: IPFS gateway services
- **Smart Contracts**: On-chain proof records (Solana/Ethereum)

### Design System
```css
/* 2025 Color Palette */
--dark-900: #0a0a0b     /* Primary background */
--dark-800: #111113     /* Secondary background */
--purple-400: #a78bfa   /* Digital Lavender accent */
--mocha: #a47864        /* Pantone 2025 Color */
--neon-purple: #bf7fff  /* Glow effects */

/* Typography Scale (Small text trend) */
--text-xs: 0.65rem      /* 10.4px */
--text-sm: 0.75rem      /* 12px */
--text-base: 0.825rem   /* 13.2px */
```

## 🔧 API Reference

### IPFS Service
```typescript
import { ipfsService } from '@/lib/ipfs';

// Upload a file
const result = await ipfsService.uploadFile(file);

// Upload proof metadata
const metadata = await ipfsService.uploadProofMetadata({
  title: "My Project",
  description: "Project description",
  // ... other fields
});
```

### Blockchain Service
```typescript
import { blockchainService } from '@/lib/blockchain';

// Submit proof to blockchain
const proof = await blockchainService.submitProof(ipfsHash, metadata);

// Get proofs by wallet
const proofs = await blockchainService.getProofsByWallet(walletAddress);
```

## 🧪 Smart Contracts

### Solana Program Structure
```rust
// Program instructions
pub enum ProofInstruction {
    SubmitProof {
        ipfs_hash: String,
        metadata_hash: String,
    },
    EndorseProof {
        proof_id: String,
        message: String,
    },
}
```

### Ethereum Contract Interface
```solidity
contract SaveYourProofs {
    struct Proof {
        address freelancer;
        string ipfsHash;
        uint256 timestamp;
        bytes signature;
    }
    
    function submitProof(string memory _ipfsHash) external;
    function endorseProof(uint256 _proofId, string memory _message) external;
}
```

## 🎨 Design Guidelines

### 2025 UI Principles
- **Minimalist Aesthetic**: Clean, uncluttered interfaces
- **Micro Typography**: Smaller, refined text for modern feel
- **Dark Mode Priority**: Black backgrounds with purple accents
- **Subtle Animations**: Smooth, purposeful motion design
- **Glass Effects**: Translucent panels with backdrop blur
- **Glow Elements**: Sci-fi inspired hover and focus states

### Component Examples
```jsx
// Neon Button with 2025 styling
<button className="neon-button-primary">
  Submit Proof
</button>

// Glass panel with backdrop blur
<div className="glass-panel-strong">
  Content here
</div>

// Glow text effect
<h1 className="glow-text">SaveYourProofs</h1>
```

## 🔐 Security

- **Wallet Signatures**: All proofs are cryptographically signed
- **IPFS Immutability**: Content cannot be modified once uploaded
- **On-chain Verification**: Blockchain provides tamper-proof records
- **Client-side Encryption**: Sensitive data never leaves your device unencrypted

## 🌐 Browser Support

| Browser | Support |
|---------|---------|
| Chrome | ✅ Full |
| Firefox | ✅ Full |
| Safari | ✅ Full |
| Edge | ✅ Full |
| Mobile Safari | ✅ Full |
| Chrome Mobile | ✅ Full |

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🚧 Roadmap

### Phase 1 - Core Platform (Current)
- [x] Wallet connection (Solana/Ethereum)
- [x] IPFS integration
- [x] Proof submission system
- [x] 2025 design implementation
- [ ] Smart contract deployment

### Phase 2 - Enhanced Features
- [ ] ENS/SNS domain integration
- [ ] Advanced search and filtering
- [ ] Reputation scoring algorithm
- [ ] Mobile app (React Native)

### Phase 3 - Platform Expansion
- [ ] Multi-chain support (Polygon, Arbitrum)
- [ ] NFT proof certificates
- [ ] Freelancer marketplace integration
- [ ] API for third-party platforms

## 💬 Community

- **Discord**: [Join our community](https://discord.gg/saveyourproofs)
- **Twitter**: [@SaveYourProofs](https://twitter.com/saveyourproofs)
- **Telegram**: [SaveYourProofs Chat](https://t.me/saveyourproofs)

## 📞 Support

If you encounter any issues or have questions:

1. Check our [FAQ](docs/FAQ.md)
2. Search [existing issues](https://github.com/yourusername/saveyourproofs/issues)
3. Create a [new issue](https://github.com/yourusername/saveyourproofs/issues/new)
4. Join our Discord for real-time help

---

**Built with ❤️ by freelancers, for freelancers.**

*"Your work, your proof, your reputation - all secured on the blockchain."* # loogyourproofs
