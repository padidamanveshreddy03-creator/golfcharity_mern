# Architecture Overview

## System Design

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Public     │  │   Dashboard  │  │    Admin     │          │
│  │  Pages      │  │   Pages      │  │    Pages     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└────────────────────────────────┬───────────────────────────────┘
                                 │
                    ┌────────────┴─────────────┐
                    │     API Router           │
                    │  (app/api/*)            │
                    └────────────┬─────────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
    ┌───▼────┐           ┌───────▼────────┐      ┌────────▼────┐
    │Supabase│           │   Stripe       │      │    Storage  │
    │Database│           │   Payments     │      │   (Images)  │
    │(Auth)  │           │   (webhooks)   │      │             │
    └────────┘           └────────────────┘      └─────────────┘
```

## Data Flow

### 1. User Registration

```
User → Signup Form → Supabase Auth → Create Profile → Create User Charity → Redirect to Pricing
```

### 2. Subscription Flow

```
User → Pricing → Stripe Checkout → Stripe Webhook → Update Subscription → Unlock Dashboard
```

### 3. Score Entry

```
User → Dashboard → Add Score → API → Database (Max 5 stored) → Update UI
```

### 4. Monthly Draw

```
Admin → Run Draw → Calculate Pool → Match Scores → Create Winners → Publish Results
```

### 5. Winner Verification

```
Winner → Upload Proof → Admin Review → Approve/Reject → Payment Status
```

## Technology Stack Details

### Frontend Layer

- **Framework**: Next.js 14 with App Router
- **UI Library**: React 18
- **Styling**: Tailwind CSS with custom theme
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod validation
- **HTTP Client**: Fetch API

### Backend Layer

- **Runtime**: Node.js (Vercel)
- **Server Framework**: Next.js API Routes
- **ORM**: Supabase Client
- **Payments**: Stripe SDK

### Database Layer

- **Primary**: Supabase PostgreSQL
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage
- **Type Safety**: Row-Level Security + Triggers

### Infrastructure

- **Hosting**: Vercel
- **Database Host**: Supabase
- **CDN**: Vercel Edge Network
- **Backups**: Supabase Automated

## Security Architecture

### 1. Authentication

```
User Input → Supabase Auth → JWT Token → Session Management
```

### 2. Authorization

```
Request + Token → Check Role → Row-Level Security → Return Data
```

### 3. Data Protection

```
User Data → Encrypted in Transit (HTTPS) → RLS Policies → Access Control
```

### 4. Payment Security

```
Card Info → Stripe (PCI Compliant) → Never Stored Locally
```

## Database Schema Relationships

```
profiles (1) ─────────────── (1) subscriptions
    │
    ├─── (1) ─────────────── (1) user_charity ─── (1) charities
    │
    ├─── (1) ─────────────── (N) scores
    │
    ├─── (1) ─────────────── (N) winnings ─── (N) draws
    │
    └─── (1) ─────────────── (N) charity_donations ─── (1) charities
```

## API Request/Response Cycle

```
Client Request
    ↓
Next.js API Route
    ↓
Validation (Zod)
    ↓
Auth Check (JWT)
    ↓
Authorization Check (RLS)
    ↓
Database Operation (Supabase)
    ↓
Response Formatting
    ↓
Error Handling
    ↓
JSON Response
```

## Deployment Architecture

### Development

```
Local Machine → npm run dev → http://localhost:3000
```

### Production

```
GitHub → Vercel Deploy → Edge Functions → Global CDN
                ↓
        Supabase Database (auto-backup)
        Stripe (webhooks)
```

## Scaling Considerations

### Current (Single Region)

- Suitable for < 10K users
- Basic database indexing
- No caching layer

### Medium Scale (10K - 100K users)

- Add Redis caching
- Implement CDN caching
- Database query optimization
- Rate limiting

### Large Scale (100K+ users)

- Database replication
- Microservices architecture
- Message queues
- Advanced monitoring
- Load balancing

## Performance Optimization

### Frontend

- Server-side rendering (SSR)
- Static site generation (SSG)
- Code splitting
- Image optimization
- Lazy loading

### Backend

- Database indexing
- Query optimization
- Connection pooling
- API response caching
- Webhook queue processing

### Infrastructure

- CDN for static assets
- Edge caching
- Compression (gzip)
- HTTP/2

## Monitoring & Observability

### Error Tracking

- Console error handling
- API error responses
- Database error logging

### Performance Monitoring

- Vercel analytics
- Database query logs
- Stripe transaction logs

### Security Monitoring

- Auth failure tracking
- RLS policy violations
- Webhooks integrity

## Disaster Recovery

### Backup Strategy

```
Daily → Vercel Backup
        Supabase PITR (Point-in-time recovery)

Weekly → Manual Database Export
```

### Recovery Procedures

```
Data Loss → Restore from PITR
Deployment Error → Vercel Rollback
Service Down → Manual Failover
```

## Development Workflow

```
Feature Branch → Create PR → Code Review → Merge to Main → Auto Deploy to Vercel
```

## Environment Management

```
Development (.env.local)
    ↓
Staging (test environment variables)
    ↓
Production (Vercel environment variables)
```

---

This architecture ensures:
✅ Scalability - Can grow with user base
✅ Security - Multiple layers of protection
✅ Maintainability - Clear separation of concerns
✅ Reliability - Redundancy and backups
✅ Performance - Optimized at each layer
