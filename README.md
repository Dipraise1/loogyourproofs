# SolGigs - Production-Ready Web3 Freelancer Platform

A complete Web3 platform for freelancers to find gigs, create immutable proof-of-work portfolios, and build reputation on the blockchain. Users can connect their wallets, submit verified work evidence, earn client endorsements, and establish their Web3 reputation.

## 🚀 Features

- **Wallet Integration**: Connect Phantom, MetaMask, and Solflare wallets
- **Task Management**: Create, apply to, and complete social media tasks
- **User Profiles**: Comprehensive freelancer profiles with specialties and social links
- **Proof of Work**: Submit and verify work with blockchain records
- **Real-time Updates**: Live notifications and status updates
- **File Storage**: Supabase Storage for secure file uploads
- **Multi-chain Support**: Solana and Ethereum blockchain integration
- **Real Payments**: Actual crypto transactions on blockchain
- **Production Ready**: Fully deployed and scalable

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Blockchain**: Solana, Ethereum with real transactions
- **Storage**: Supabase Storage for all file uploads
- **State Management**: Zustand
- **UI Components**: Framer Motion, Lucide React
- **Deployment**: Vercel (production ready)

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account
- Solana/Ethereum RPC endpoints
- Web3 wallet (Phantom, MetaMask, Solflare)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd loogyourproofs
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the SQL schema from `SUPABASE_SETUP.md` in your Supabase SQL Editor
3. Get your project URL and anon key from Settings > API

### 3. Environment Variables

Create a `.env.local` file:

```env
# Supabase Configuration (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Solana Configuration (REQUIRED for Solana payments)
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta

# Ethereum Configuration (REQUIRED for Ethereum payments)
NEXT_PUBLIC_ETHEREUM_NETWORK=mainnet
NEXT_PUBLIC_ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/your-infura-key
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
├── app/                    # Next.js app directory
│   ├── components/         # Reusable UI components
│   ├── dashboard/          # User dashboard
│   ├── explore/            # Freelancer discovery
│   ├── profile/            # User profile management
│   ├── tasks/              # Task browsing
│   ├── create-task/        # Task creation
│   ├── task/[id]/          # Task detail pages
│   └── submit/             # Proof submission
├── lib/                    # Core business logic
│   ├── hooks/              # Custom React hooks
│   ├── store.ts            # Zustand state management
│   ├── supabase.ts         # Supabase client
│   ├── user-service.ts     # User management
│   ├── task-service.ts     # Task management
│   └── blockchain.ts       # Blockchain integration
├── public/                 # Static assets
└── SUPABASE_SETUP.md       # Database schema
```

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Key Components

- **WalletConnect**: Handles wallet connection and user authentication
- **TaskService**: Manages task creation, applications, and completions
- **UserService**: Handles user profiles and statistics
- **SupabaseService**: Database operations and real-time updates

## 🚀 Production Deployment

See `PRODUCTION_DEPLOYMENT.md` for detailed production deployment instructions.

### Quick Deploy to Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Login: `vercel login`
3. Deploy: `vercel --prod`
4. Set environment variables in Vercel dashboard

### Production Features

- ✅ **Real Crypto Payments**: Actual Solana/Ethereum transactions
- ✅ **Supabase Storage**: Secure file uploads and storage
- ✅ **Production Database**: Full PostgreSQL schema with RLS
- ✅ **Wallet Integration**: Phantom, MetaMask, Solflare support
- ✅ **Task Management**: Complete task lifecycle
- ✅ **User Profiles**: Comprehensive freelancer profiles
- ✅ **Real-time Updates**: Live notifications and status

## 🎯 Usage

### For Freelancers

1. **Connect Wallet**: Link your Web3 wallet for authentication
2. **Create Profile**: Set up your freelancer profile with specialties
3. **Browse Tasks**: Find social media tasks that match your skills
4. **Apply**: Submit applications with personalized messages
5. **Complete Work**: Submit proof of completion
6. **Build Reputation**: Earn endorsements and build your Web3 reputation

### For Clients

1. **Connect Wallet**: Link your Web3 wallet
2. **Create Tasks**: Post social media engagement tasks
3. **Review Applications**: Accept applications from qualified freelancers
4. **Verify Completion**: Review and verify completed work
5. **Make Payments**: Process payments through the platform

## 🔒 Security

- Wallet-based authentication
- Row Level Security (RLS) in Supabase
- Input validation and sanitization
- Secure environment variable handling
- CORS configuration

## 📊 Database Schema

The application uses the following main tables:

- **users**: User profiles and authentication
- **tasks**: Task listings and details
- **task_applications**: User applications to tasks
- **task_completions**: Completed work verification
- **proofs**: Proof-of-work submissions
- **notifications**: Real-time user notifications

See `SUPABASE_SETUP.md` for complete schema details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Documentation**: Check the `/docs` folder for detailed guides
- **Issues**: Report bugs and request features via GitHub Issues
- **Discord**: Join our community for support and discussions

## 🔮 Roadmap

- [x] Payment integration with crypto wallets
- [x] Real blockchain transactions
- [x] Supabase Storage integration
- [x] Production-ready deployment
- [ ] Advanced search and filtering
- [ ] Mobile app development
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Smart contract integration
- [ ] NFT-based achievements
- [ ] Decentralized governance

## 🙏 Acknowledgments

- Solana Labs for wallet adapter
- Supabase for backend infrastructure
- Vercel for deployment platform
- The Web3 community for inspiration

---

**Built with ❤️ for the decentralized future of freelancing**