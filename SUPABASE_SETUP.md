# Supabase Setup Guide for SolGigs

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up/Login and create a new project
3. Choose a project name (e.g., "solgigs")
4. Set a database password
5. Choose a region close to your users

## 2. Get Your Credentials

1. Go to Settings > API
2. Copy your Project URL and anon/public key
3. Add them to your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## 3. Create Database Tables

Run the following SQL in your Supabase SQL Editor:

```sql
-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create users table (wallet-based authentication)
CREATE TABLE IF NOT EXISTS users (
  wallet_address TEXT PRIMARY KEY,
  wallet_type TEXT NOT NULL, -- 'phantom', 'metamask', etc.
  name TEXT,
  bio TEXT,
  avatar TEXT,
  specialties TEXT[] DEFAULT '{}',
  rating NUMERIC DEFAULT 0,
  total_tasks_completed INTEGER DEFAULT 0,
  total_earnings NUMERIC DEFAULT 0,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  social JSONB DEFAULT '{}',
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  budget TEXT NOT NULL,
  duration TEXT NOT NULL,
  location TEXT DEFAULT 'Remote',
  client_address TEXT NOT NULL,
  client_name TEXT,
  rating NUMERIC DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  platform TEXT NOT NULL, -- 'twitter', 'discord', 'tiktok', etc.
  requirements TEXT[] DEFAULT '{}',
  payment_method TEXT DEFAULT 'crypto', -- 'crypto', 'fiat', 'both'
  status TEXT DEFAULT 'open', -- 'open', 'in_progress', 'completed', 'cancelled'
  featured BOOLEAN DEFAULT FALSE,
  urgent BOOLEAN DEFAULT FALSE,
  applicants_count INTEGER DEFAULT 0,
  posted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create task_applications table
CREATE TABLE IF NOT EXISTS task_applications (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  applicant_address TEXT NOT NULL REFERENCES users(wallet_address),
  applicant_name TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'rejected', 'completed'
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  proof_of_completion TEXT,
  payment_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create task_completions table
CREATE TABLE IF NOT EXISTS task_completions (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  application_id TEXT NOT NULL REFERENCES task_applications(id) ON DELETE CASCADE,
  applicant_address TEXT NOT NULL REFERENCES users(wallet_address),
  proof_urls TEXT[] DEFAULT '{}',
  completion_message TEXT NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified BOOLEAN DEFAULT FALSE,
  payment_amount TEXT,
  payment_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create proofs table (for portfolio/proof-of-work)
CREATE TABLE IF NOT EXISTS proofs (
  id TEXT PRIMARY KEY,
  wallet_address TEXT NOT NULL REFERENCES users(wallet_address),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  attachments JSONB DEFAULT '[]',
  github_repo TEXT,
  live_demo TEXT,
  client_address TEXT,
  ipfs_hash TEXT,
  timestamp BIGINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  blockchain_record JSONB,
  endorsements JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create endorsements table
CREATE TABLE IF NOT EXISTS endorsements (
  id TEXT PRIMARY KEY,
  proof_id TEXT NOT NULL REFERENCES proofs(id) ON DELETE CASCADE,
  endorser_address TEXT NOT NULL REFERENCES users(wallet_address),
  message TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  signature TEXT,
  transaction_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_address TEXT NOT NULL REFERENCES users(wallet_address),
  type TEXT NOT NULL, -- 'task_applied', 'task_accepted', 'task_completed', 'payment_received'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_joined_at ON users(joined_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active DESC);

CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_platform ON tasks(platform);
CREATE INDEX IF NOT EXISTS idx_tasks_client_address ON tasks(client_address);
CREATE INDEX IF NOT EXISTS idx_tasks_posted_at ON tasks(posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_featured ON tasks(featured);
CREATE INDEX IF NOT EXISTS idx_tasks_urgent ON tasks(urgent);

CREATE INDEX IF NOT EXISTS idx_task_applications_task_id ON task_applications(task_id);
CREATE INDEX IF NOT EXISTS idx_task_applications_applicant ON task_applications(applicant_address);
CREATE INDEX IF NOT EXISTS idx_task_applications_status ON task_applications(status);
CREATE INDEX IF NOT EXISTS idx_task_applications_applied_at ON task_applications(applied_at DESC);

CREATE INDEX IF NOT EXISTS idx_task_completions_task_id ON task_completions(task_id);
CREATE INDEX IF NOT EXISTS idx_task_completions_applicant ON task_completions(applicant_address);
CREATE INDEX IF NOT EXISTS idx_task_completions_verified ON task_completions(verified);
CREATE INDEX IF NOT EXISTS idx_task_completions_completed_at ON task_completions(completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_proofs_wallet_address ON proofs(wallet_address);
CREATE INDEX IF NOT EXISTS idx_proofs_timestamp ON proofs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_proofs_status ON proofs(status);
CREATE INDEX IF NOT EXISTS idx_proofs_type ON proofs(type);

CREATE INDEX IF NOT EXISTS idx_endorsements_proof_id ON endorsements(proof_id);
CREATE INDEX IF NOT EXISTS idx_endorsements_endorser ON endorsements(endorser_address);

CREATE INDEX IF NOT EXISTS idx_notifications_user_address ON notifications(user_address);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE endorsements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Public read access for users" ON users
  FOR SELECT USING (true);

CREATE POLICY "Public read access for tasks" ON tasks
  FOR SELECT USING (true);

CREATE POLICY "Public read access for proofs" ON proofs
  FOR SELECT USING (true);

CREATE POLICY "Public read access for endorsements" ON endorsements
  FOR SELECT USING (true);

-- Create policies for authenticated users to insert/update their own data
CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (auth.uid()::text = wallet_address);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid()::text = wallet_address);

CREATE POLICY "Users can insert tasks" ON tasks
  FOR INSERT WITH CHECK (auth.uid()::text = client_address);

CREATE POLICY "Users can update their own tasks" ON tasks
  FOR UPDATE USING (auth.uid()::text = client_address);

CREATE POLICY "Users can insert task applications" ON task_applications
  FOR INSERT WITH CHECK (auth.uid()::text = applicant_address);

CREATE POLICY "Users can update their own applications" ON task_applications
  FOR UPDATE USING (auth.uid()::text = applicant_address);

CREATE POLICY "Users can insert task completions" ON task_completions
  FOR INSERT WITH CHECK (auth.uid()::text = applicant_address);

CREATE POLICY "Users can update their own completions" ON task_completions
  FOR UPDATE USING (auth.uid()::text = applicant_address);

CREATE POLICY "Users can insert their own proofs" ON proofs
  FOR INSERT WITH CHECK (auth.uid()::text = wallet_address);

CREATE POLICY "Users can update their own proofs" ON proofs
  FOR UPDATE USING (auth.uid()::text = wallet_address);

CREATE POLICY "Users can insert endorsements" ON endorsements
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can read their own notifications" ON notifications
  FOR SELECT USING (auth.uid()::text = user_address);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid()::text = user_address);

CREATE POLICY "Users can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Create storage bucket for file uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('proof-attachments', 'proof-attachments', true);

-- Create storage policies
CREATE POLICY "Public read access for attachments" ON storage.objects
  FOR SELECT USING (bucket_id = 'proof-attachments');

CREATE POLICY "Users can upload attachments" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'proof-attachments');

CREATE POLICY "Users can update their own attachments" ON storage.objects
  FOR UPDATE USING (bucket_id = 'proof-attachments');

CREATE POLICY "Users can delete their own attachments" ON storage.objects
  FOR DELETE USING (bucket_id = 'proof-attachments');
```

## 4. Test Your Setup

1. Start your development server: `npm run dev`
2. Go to `/submit` page
3. Try submitting a proof with a file attachment
4. Check your Supabase dashboard to see if data is being saved

## 5. Production Deployment

1. Add your Supabase credentials to Vercel environment variables
2. Deploy your application
3. Test the production environment

## Troubleshooting

### Common Issues:

1. **"Invalid API key"**: Check your Supabase URL and anon key
2. **"Table doesn't exist"**: Run the SQL schema creation script
3. **"Permission denied"**: Check your RLS policies
4. **"File upload failed"**: Verify storage bucket and policies are set up

### Debug Steps:

1. Check browser console for errors
2. Check Supabase logs in the dashboard
3. Verify environment variables are loaded
4. Test database connection in Supabase dashboard

## Features Enabled:

✅ **Proof Submission**: Users can submit work proofs with attachments
✅ **File Storage**: Files are stored in Supabase Storage
✅ **Freelancer Profiles**: User profiles are automatically created
✅ **Endorsements**: Users can endorse each other's work
✅ **Search**: Full-text search across proofs and freelancers
✅ **Real-time**: Data updates in real-time
✅ **Offline Fallback**: Falls back to localStorage if Supabase is unavailable
