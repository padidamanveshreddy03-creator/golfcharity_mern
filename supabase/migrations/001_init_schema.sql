-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================
-- PROFILES TABLE
-- ==============================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================
-- CHARITIES TABLE
-- ==============================
CREATE TABLE charities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  website_url TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================
-- USER_CHARITY TABLE (Join table)
-- ==============================
CREATE TABLE user_charity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  charity_id UUID NOT NULL REFERENCES charities(id) ON DELETE CASCADE,
  contribution_percentage DECIMAL(5, 2) NOT NULL DEFAULT 10.00 CHECK (contribution_percentage >= 10 AND contribution_percentage <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, charity_id)
);

-- ==============================
-- SUBSCRIPTIONS TABLE
-- ==============================
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('monthly', 'yearly')),
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
  amount_in_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================
-- SCORES TABLE
-- ==============================
CREATE TABLE scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 45),
  score_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  INDEX idx_user_scores (user_id, score_date DESC)
);

-- ==============================
-- DRAWS TABLE
-- ==============================
CREATE TABLE draws (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draw_date DATE NOT NULL UNIQUE,
  draw_numbers INTEGER[] NOT NULL,
  draw_mode TEXT NOT NULL CHECK (draw_mode IN ('random', 'algorithm')),
  status TEXT NOT NULL CHECK (status IN ('simulated', 'published', 'archived')),
  total_pool_amount_cents INTEGER NOT NULL DEFAULT 0,
  five_match_pool_cents INTEGER NOT NULL,
  four_match_pool_cents INTEGER NOT NULL,
  three_match_pool_cents INTEGER NOT NULL,
  five_match_winners_carried_over BOOLEAN DEFAULT FALSE,
  results_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================
-- WINNINGS TABLE
-- ==============================
CREATE TABLE winnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  draw_id UUID NOT NULL REFERENCES draws(id) ON DELETE CASCADE,
  matches_count INTEGER NOT NULL CHECK (matches_count IN (3, 4, 5)),
  amount_won_cents INTEGER NOT NULL,
  proof_image_url TEXT,
  verification_status TEXT NOT NULL CHECK (verification_status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  payment_status TEXT NOT NULL CHECK (payment_status IN ('pending', 'paid')) DEFAULT 'pending',
  verified_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, draw_id)
);

-- ==============================
-- CHARITY_DONATIONS TABLE
-- ==============================
CREATE TABLE charity_donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  charity_id UUID NOT NULL REFERENCES charities(id) ON DELETE CASCADE,
  amount_in_cents INTEGER NOT NULL,
  donation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================
-- STRIPE_EVENTS TABLE (for webhook tracking)
-- ==============================
CREATE TABLE stripe_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================
-- INDEXES FOR PERFORMANCE
-- ==============================
CREATE INDEX idx_profiles_admin ON profiles(is_admin);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_scores_user_id ON scores(user_id);
CREATE INDEX idx_draws_date ON draws(draw_date);
CREATE INDEX idx_draws_status ON draws(status);
CREATE INDEX idx_winnings_user_id ON winnings(user_id);
CREATE INDEX idx_winnings_draw_id ON winnings(draw_id);
CREATE INDEX idx_winnings_status ON winnings(verification_status, payment_status);
CREATE INDEX idx_charity_donations_user_id ON charity_donations(user_id);
CREATE INDEX idx_user_charity_user_id ON user_charity(user_id);

-- ==============================
-- ROW LEVEL SECURITY (RLS)
-- ==============================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE winnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_charity ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read their own profile, admins can read all
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id OR (SELECT is_admin FROM profiles WHERE id = auth.uid()));

-- Scores: Users can read/write their own scores
CREATE POLICY "Users can create their own scores"
  ON scores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own scores"
  ON scores FOR SELECT
  USING (auth.uid() = user_id OR (SELECT is_admin FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update their own scores"
  ON scores FOR UPDATE
  USING (auth.uid() = user_id);

-- Subscriptions: Users can read their own, admins can read all
CREATE POLICY "Users can view their own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id OR (SELECT is_admin FROM profiles WHERE id = auth.uid()));

-- Winnings: Users can read their own, admins can read all
CREATE POLICY "Users can view their own winnings"
  ON winnings FOR SELECT
  USING (auth.uid() = user_id OR (SELECT is_admin FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can upload proof for their winnings"
  ON winnings FOR UPDATE
  USING (auth.uid() = user_id);

-- User Charity: Users can manage their own charity selection
CREATE POLICY "Users can manage their charity selection"
  ON user_charity FOR ALL
  USING (auth.uid() = user_id);

-- Charities are publicly readable
ALTER TABLE charities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Charities are publicly viewable"
  ON charities FOR SELECT
  USING (true);

-- Draws are publicly readable
ALTER TABLE draws ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Draws are publicly viewable"
  ON draws FOR SELECT
  USING (true);
