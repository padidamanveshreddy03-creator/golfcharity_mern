# Getting Started Guide

## Quick Start (5 minutes)

### 1. Installation

```bash
cd golf-charity-app
npm install
```

### 2. Database Setup (Supabase)

1. Create project at https://supabase.com
2. Copy the SQL from `supabase/migrations/001_init_schema.sql`
3. Go to SQL Editor and paste & execute

### 3. Environment Variables

Create `.env.local`:

```env
# Supabase - Get from Supabase dashboard
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Stripe - Get from Stripe test dashboard
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_MONTHLY_PRICE_ID=price_xxx
STRIPE_YEARLY_PRICE_ID=price_xxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000

### 5. Seed Sample Data

Copy & run in Supabase SQL Editor:

```bash
cat supabase/seed.sql
```

## Features to Test

### 1. Authentication

- [ ] Sign up new user
- [ ] Verify email confirmation (if enabled)
- [ ] Login with credentials
- [ ] Logout

### 2. Dashboard

- [ ] View user dashboard
- [ ] Add golf scores (1-45)
- [ ] Verify last 5 scores stored
- [ ] Old score gets replaced automatically

### 3. Charities

- [ ] Browse charities page
- [ ] View charity details
- [ ] Charity listed on homepage

### 4. Subscriptions (Stripe)

- [ ] Visit pricing page
- [ ] Click subscribe
- [ ] Enter Stripe test card: 4242 4242 4242 4242
- [ ] Verify subscription created in database
- [ ] Check Stripe customer created

### 5. Admin Panel

- [ ] Access /admin
- [ ] View dashboard stats
- [ ] Simulate a draw
- [ ] Manage charities
- [ ] View winners

## File Structure Explanation

```
app/
├── (public)/          - Public-facing pages (home, pricing, charities)
├── (auth)/            - Auth pages (login, signup)
├── (dashboard)/       - User dashboard
├── (admin)/           - Admin panel
└── api/              - Backend API routes

components/
├── ui/               - Reusable UI components (Button, Input, etc)
├── layout/           - Layout components (Header, Footer)
└── forms/            - Form components

lib/
├── supabase.ts      - Database operations
├── stripe.ts        - Payment processing
├── draw-logic.ts    - Draw algorithms
├── auth.ts          - Auth utilities
└── utils.ts         - Validation & helpers

types/
└── index.ts         - TypeScript interfaces
```

## Common Tasks

### Add a New API Endpoint

1. Create file in `app/api/[resource]/route.ts`
2. Export GET, POST, PATCH, DELETE handlers
3. Use `supabaseServer` for database operations
4. Import and use validation from `lib/utils.ts`

Example:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const { data } = await request.json();
  const { data: result } = await supabaseServer.from("table").insert(data);
  return NextResponse.json({ success: true, data: result });
}
```

### Add a New Page

1. Create file in `app/path/page.tsx`
2. Use "use client" for interactive components
3. Import UI components from `@/components/ui/*`
4. Use `supabase` client for read operations

Example:

```typescript
"use client";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";

export default function MyPage() {
  return <Button>Click me</Button>;
}
```

### Create a New UI Component

1. Create in `components/ui/ComponentName.tsx`
2. Use Tailwind classes
3. Support dark mode
4. Export as default

Example:

```typescript
export const MyComponent: React.FC = () => (
  <div className="p-4 bg-card rounded-lg">
    Content here
  </div>
);
```

## Database Operations

### Read Data

```typescript
const { data } = await supabase.from("table").select("*").eq("column", value);
```

### Write Data (Server-side)

```typescript
const { data } = await supabaseServer.from("table").insert({ column: value });
```

### Update Data

```typescript
const { data } = await supabaseServer
  .from("table")
  .update({ column: newValue })
  .eq("id", id);
```

## Styling

All Tailwind classes available. Key utilities:

```typescript
// Buttons
className = "btn btn-primary"; // Primary button
className = "btn btn-outline"; // Outlined button

// Cards
className = "card"; // Card container
className = "card-header"; // Header section
className = "card-content"; // Content section

// Forms
className = "form-label"; // Labels
className = "form-input"; // Inputs
className = "form-group"; // Input group

// Text
className = "heading-h1"; // H1 heading
className = "heading-h2"; // H2 heading
className = "text-subtle"; // Subtle text

// Colors
bg - primary; // Primary color
text - primary; // Primary text
bg - accent; // Accent color
```

## Debugging

### Check Supabase

1. Go to Supabase dashboard
2. SQL Editor - query tables directly
3. Auth - view users and sessions
4. Logs - check error logs

### Check Stripe

1. Go to Stripe dashboard
2. Customers - view test customers
3. Subscriptions - view test subscriptions
4. Webhooks - view webhook logs

### Browser Console

```typescript
// Check if environment variables loaded
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL);

// Check current user
const {
  data: { user },
} = await supabase.auth.getUser();
console.log(user);
```

## Troubleshooting

### "Cannot read property 'getSession' of undefined"

- Make sure Supabase keys are correct
- Check NEXT_PUBLIC_SUPABASE_URL has full URL

### "STRIPE_SECRET_KEY is not defined"

- Ensure STRIPE_SECRET_KEY in .env.local
- Restart dev server after env changes

### Payment not going through

- Use Stripe test card: 4242 4242 4242 4242
- Check webhook secret is correct
- Verify webhook is configured in Stripe

### Scores not saving

- Check user_id matches auth user
- Verify subscriptions table has entries
- Check database is connected

## Next Steps

1. ✅ Setup local development
2. ✅ Test all features
3. → Deploy to Vercel
4. → Configure production Stripe
5. → Monitor and scale

See [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment steps.

---

👉 [View Full Documentation](./README.md)
