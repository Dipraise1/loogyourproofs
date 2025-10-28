# SolGigs - Production Deployment Guide

## 🚀 Production Setup

### Prerequisites

- Node.js 18+ 
- Supabase account
- Solana/Ethereum RPC endpoints
- Domain name (optional)

### 1. Environment Variables

Create a `.env.local` file with the following variables:

```bash
# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Solana Configuration (Required for Solana payments)
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta

# Ethereum Configuration (Required for Ethereum payments)
NEXT_PUBLIC_ETHEREUM_NETWORK=mainnet
NEXT_PUBLIC_ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/your-infura-key
```

### 2. Supabase Setup

#### Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Get your project URL and anon key

#### Database Schema
Run the following SQL in your Supabase SQL editor:

```sql
-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT UNIQUE NOT NULL,
  name TEXT,
  bio TEXT,
  avatar TEXT,
  specialties TEXT[],
  rating DECIMAL(3,2) DEFAULT 0,
  total_proofs INTEGER DEFAULT 0,
  total_endorsements INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  earnings DECIMAL(10,2) DEFAULT 0,
  social JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  budget TEXT NOT NULL,
  duration TEXT NOT NULL,
  location TEXT NOT NULL,
  client_address TEXT NOT NULL,
  client_name TEXT NOT NULL,
  platform TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  requirements TEXT,
  deliverables TEXT,
  urgent BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'open',
  posted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  applicants_count INTEGER DEFAULT 0
);

-- Task applications table
CREATE TABLE IF NOT EXISTS task_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  applicant_address TEXT NOT NULL,
  applicant_name TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task completions table
CREATE TABLE IF NOT EXISTS task_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  application_id UUID REFERENCES task_applications(id) ON DELETE CASCADE,
  applicant_address TEXT NOT NULL,
  proof_urls TEXT[] DEFAULT '{}',
  completion_message TEXT NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified BOOLEAN DEFAULT FALSE,
  payment_amount TEXT,
  payment_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Proofs table
CREATE TABLE IF NOT EXISTS proofs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  wallet_address TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  github_repo TEXT,
  live_demo TEXT,
  client_address TEXT,
  ipfs_hash TEXT,
  status TEXT DEFAULT 'pending',
  blockchain_record JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Endorsements table
CREATE TABLE IF NOT EXISTS endorsements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  proof_id UUID REFERENCES proofs(id) ON DELETE CASCADE,
  endorser_address TEXT NOT NULL,
  message TEXT,
  blockchain_record JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_address TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Public data tables
CREATE TABLE IF NOT EXISTS public_freelancers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT UNIQUE NOT NULL,
  profile_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public_proofs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  proof_id TEXT UNIQUE NOT NULL,
  wallet_address TEXT NOT NULL,
  proof_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public_proof_metadata (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  proof_id TEXT UNIQUE NOT NULL,
  metadata JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public_registry (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  registry_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security Policies
CREATE POLICY "Public read access for users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

CREATE POLICY "Public read access for tasks" ON tasks FOR SELECT USING (true);
CREATE POLICY "Users can create tasks" ON tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own tasks" ON tasks FOR UPDATE USING (client_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

CREATE POLICY "Public read access for applications" ON task_applications FOR SELECT USING (true);
CREATE POLICY "Users can create applications" ON task_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own applications" ON task_applications FOR UPDATE USING (applicant_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

CREATE POLICY "Public read access for completions" ON task_completions FOR SELECT USING (true);
CREATE POLICY "Users can create completions" ON task_completions FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own completions" ON task_completions FOR UPDATE USING (applicant_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

CREATE POLICY "Public read access for proofs" ON proofs FOR SELECT USING (true);
CREATE POLICY "Users can create proofs" ON proofs FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own proofs" ON proofs FOR UPDATE USING (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

CREATE POLICY "Public read access for endorsements" ON endorsements FOR SELECT USING (true);
CREATE POLICY "Users can create endorsements" ON endorsements FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can read own notifications" ON notifications FOR SELECT USING (user_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');
CREATE POLICY "Users can create notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (user_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- Public data policies
CREATE POLICY "Public read access for public_freelancers" ON public_freelancers FOR SELECT USING (true);
CREATE POLICY "Public read access for public_proofs" ON public_proofs FOR SELECT USING (true);
CREATE POLICY "Public read access for public_proof_metadata" ON public_proof_metadata FOR SELECT USING (true);
CREATE POLICY "Public read access for public_registry" ON public_registry FOR SELECT USING (true);

-- Storage bucket for file uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('proof-attachments', 'proof-attachments', true);

-- Storage policies
CREATE POLICY "Public read access for proof attachments" ON storage.objects FOR SELECT USING (bucket_id = 'proof-attachments');
CREATE POLICY "Authenticated users can upload proof attachments" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'proof-attachments' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update own proof attachments" ON storage.objects FOR UPDATE USING (bucket_id = 'proof-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own proof attachments" ON storage.objects FOR DELETE USING (bucket_id = 'proof-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
```

#### Storage Setup
1. Go to Storage in your Supabase dashboard
2. Create a bucket named `proof-attachments`
3. Set it to public
4. Configure the storage policies as shown above

### 3. RPC Endpoints

#### Solana RPC
- **Free**: `https://api.mainnet-beta.solana.com` (rate limited)
- **Recommended**: Get a dedicated RPC from [QuickNode](https://quicknode.com), [Alchemy](https://alchemy.com), or [Helius](https://helius.xyz)

#### Ethereum RPC
- **Free**: `https://mainnet.infura.io/v3/YOUR_KEY` (rate limited)
- **Recommended**: Get a dedicated RPC from [Infura](https://infura.io), [Alchemy](https://alchemy.com), or [QuickNode](https://quicknode.com)

### 4. Deployment Options

#### Option A: Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push

#### Option B: Netlify
1. Connect your GitHub repository to Netlify
2. Set environment variables in Netlify dashboard
3. Deploy automatically on push

#### Option C: Self-hosted
1. Build the application: `npm run build`
2. Start the production server: `npm start`
3. Use a reverse proxy (nginx) for SSL

### 5. Domain Setup (Optional)

1. Purchase a domain name
2. Point DNS to your hosting provider
3. Configure SSL certificate
4. Update environment variables with your domain

### 6. Performance Optimization

#### Build Optimizations
- Enable compression
- Use CDN for static assets
- Optimize images
- Enable caching headers

#### Database Optimizations
- Add database indexes for frequently queried fields
- Use connection pooling
- Monitor query performance

### 7. Security Checklist

- [ ] Environment variables are secure
- [ ] Supabase RLS policies are properly configured
- [ ] Storage policies are restrictive
- [ ] HTTPS is enabled
- [ ] CORS is properly configured
- [ ] Rate limiting is implemented
- [ ] Input validation is in place

### 8. Monitoring

#### Supabase Monitoring
- Monitor database performance
- Set up alerts for errors
- Track usage metrics

#### Application Monitoring
- Use Vercel Analytics or similar
- Monitor error rates
- Track user engagement

### 9. Backup Strategy

#### Database Backups
- Supabase provides automatic backups
- Consider additional backup solutions for critical data

#### File Backups
- Supabase Storage provides redundancy
- Consider additional cloud storage for important files

### 10. Maintenance

#### Regular Updates
- Keep dependencies updated
- Monitor security advisories
- Update Supabase when needed

#### Performance Monitoring
- Monitor response times
- Track error rates
- Optimize slow queries

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/solgigs.git
   cd solgigs
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your values
   ```

4. **Set up Supabase**
   - Create a new Supabase project
   - Run the SQL schema
   - Create the storage bucket

5. **Build and deploy**
   ```bash
   npm run build
   npm start
   ```

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Check the documentation
- Contact the development team

## 🔄 Updates

The application is actively maintained. Check for updates regularly and follow the changelog for new features and improvements.
