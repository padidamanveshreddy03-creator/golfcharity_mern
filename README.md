# Golf Charity Subscription Platform

A modern, production-ready web application that combines golf score tracking, monthly draws, and charity contributions.

## 🎯 Project Overview

Golf Charity Platform enables golfers to:

- 📊 Track their last 5 golf scores in Stableford format
- 🎲 Participate in monthly lottery draws with algorithm-based and random modes
- 💰 Win real prizes from a shared pool
- ❤️ Support charities of their choice
- 📈 View detailed statistics and winnings

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS with dark mode support
- **Database**: Supabase (PostgreSQL with Row-Level Security)
- **Authentication**: Supabase Auth
- **Payments**: Stripe (test mode)
- **Storage**: Supabase Storage
- **Deployment**: Vercel-ready

## 📋 Project Structure

```
golf-charity-app/
├── app/
│   ├── (public)/              # Public pages
│   │   ├── page.tsx          # Home page
│   │   ├── pricing/          # Pricing page
│   │   └── charities/        # Charities listing & detail
│   ├── (auth)/               # Auth pages
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/          # User dashboard
│   │   └── dashboard/
│   ├── (admin)/              # Admin panel
│   │   └── admin/
│   ├── api/                  # API routes
│   │   ├── scores/
│   │   ├── subscriptions/
│   │   ├── draws/
│   │   ├── winnings/
│   │   └── stripe/
│   └── layout.tsx            # Root layout
├── components/
│   ├── ui/                   # Reusable UI components
│   ├── forms/                # Form components
│   └── layout/               # Layout components
├── lib/
│   ├── supabase.ts          # Supabase client & helpers
│   ├── stripe.ts            # Stripe utilities
│   ├── draw-logic.ts        # Draw algorithms
│   ├── auth.ts              # Auth utilities
│   └── utils.ts             # Validation & helpers
├── types/
│   └── index.ts             # TypeScript types
├── styles/
│   └── globals.css          # Global styles
├── supabase/
│   └── migrations/          # SQL migrations
└── public/                   # Static assets
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Stripe account (test mode)

### 1. Clone and Setup

```bash
cd golf-charity-app
npm install
```

### 2. Configure Environment Variables

Create `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_MONTHLY_PRICE_ID=price_...
STRIPE_YEARLY_PRICE_ID=price_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Setup Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the migration:
   ```bash
   # Copy contents of supabase/migrations/001_init_schema.sql
   # Paste and run in Supabase SQL Editor
   ```
3. Create storage buckets:
   - `winnings-proof` (for winner proof images)

### 4. Setup Stripe

1. Create test products and prices in Stripe Dashboard:
   - Monthly: $9.99
   - Yearly: $99.99
2. Get webhook endpoint signing secret
3. Update environment variables with price IDs

### 5. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

## 📊 Core Features

### Authentication

- Email/password signup and login
- Supabase Auth integration
- Profile management
- Admin role designation

### Score Tracking

- Users can enter 1-45 Stableford scores
- Last 5 scores automatically managed
- Scores displayed in dashboard
- Historical score view

### Draw System

- **Random Mode**: Equal probability for all scores
- **Algorithm Mode**: Frequency-based (popular scores weighted higher)
- Monthly draws triggered by admin
- Simulation mode to preview results
- Automatic winner detection (3, 4, or 5 matches)

### Prize Pool Distribution

- 40% for 5 matches (jackpot)
- 35% for 4 matches
- 25% for 3 matches
- Automatic rollover if no 5-match winner

### Charity System

- Users select charity at signup and dashboard
- Minimum 10% contribution percentage
- Separate donation option
- Admin can manage charities
- Featured charity on homepage

### Winner Management

- Winners upload proof images
- Admin verification workflow
- Payment status tracking
- Rejection reason support

### Subscription Management

- Monthly and yearly plans
- Stripe integration for secure payments
- Subscription status tracking
- Auto-renewal handling
- Cancellation support

### Admin Dashboard

- User management
- Draw creation and running
- Winner verification
- Analytics and statistics
- Charity management

## 🔐 Security Features

- **Row-Level Security (RLS)**: All tables protected
- **Auth**: Supabase Auth handles user sessions
- **HTTPS**: Required for production
- **API Validation**: Input validation on all endpoints
- **Error Handling**: Comprehensive error responses

## 📱 Responsive Design

- Mobile-first approach
- Tailwind CSS utilities
- Dark mode support
- Accessible components

## 🎨 UI Components

Pre-built components in `components/ui/`:

- Button (variants: primary, secondary, outline, ghost, destructive)
- Input, Select, Textarea
- Card, Badge, Alert
- Responsive layouts
- Animation utilities

## 📡 API Routes

### Scores

- `POST /api/scores` - Add score
- `GET /api/scores?user_id=...` - Get user scores

### Subscriptions

- `POST /api/subscriptions` - Create checkout session
- `GET /api/subscriptions?user_id=...` - Get subscription

### Draws

- `POST /api/draws` - Run draw
- `GET /api/draws?status=published` - Get draws

### Winnings

- `GET /api/winnings?user_id=...` - Get user winnings
- `POST /api/winnings` - Upload proof
- `PATCH /api/winnings` - Verify/reject

### Webhooks

- `POST /api/stripe/webhook` - Stripe events

## 🧪 Testing

```bash
npm run build  # Build production bundle
npm run lint   # Run linting
```

## 🚀 Deployment to Vercel

1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy!

### Environment Variables for Vercel

Add all `.env.local` variables to Vercel project settings.

## 📚 Database Schema

Key tables:

- `profiles` - User profiles and admin status
- `subscriptions` - Subscription records
- `scores` - Golf scores (last 5 per user)
- `draws` - Monthly draws
- `winnings` - Winner records
- `charities` - Charity listings
- `user_charity` - User charity selections
- `stripe_events` - Webhook event tracking

All with proper constraints, indexes, and RLS policies.

## 🔄 Draw Algorithm

### Random Mode

Generate 5 random numbers between 1-45.

### Algorithm Mode

1. Get all scores from last 30 days
2. Calculate frequency for each number (1-45)
3. Use weighted-random selection based on frequency
4. Select 5 numbers with higher probability for frequent scores

This rewards consistent scorers!

## 💳 Stripe Integration

Test mode credentials:

- Card: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits

## 📞 Support

For issues or questions:

1. Check API documentation
2. Review error messages
3. Check Supabase dashboard logs
4. Check Stripe webhook logs

## 📄 License

MIT

## 🎯 Next Steps

1. Set up Supabase project
2. Configure Stripe
3. Run migrations
4. Customize branding/colors
5. Add sample charities
6. Test payment flow
7. Deploy to Vercel

Enjoy! ⛳
