# Deployment Guide

## Prerequisites

- Vercel account
- GitHub repository
- Supabase project
- Stripe account

## Step 1: Prepare Your Repository

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/golf-charity-app.git
git branch -M main
git push -u origin main
```

## Step 2: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Go to SQL Editor
4. Create new query and paste contents of `supabase/migrations/001_init_schema.sql`
5. Run the migration
6. Create storage bucket: `winnings-proof`
7. Copy your project URL and keys

## Step 3: Setup Stripe

1. Go to https://stripe.com/docs/testing
2. Create test products:
   - Monthly: $9.99/month
   - Yearly: $99.99/year
3. Get the price IDs (price_xxx...)
4. Go to Webhooks and create endpoint for: `yourdomain.com/api/stripe/webhook`
5. Get signing secret (whsec\_...)

## Step 4: Deploy to Vercel

1. Go to https://vercel.com
2. Click "New Project"
3. Select GitHub and authorize Vercel
4. Select your golf-charity-app repository
5. Click Import

### Configure Environment Variables in Vercel:

In Project Settings → Environment Variables, add:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_MONTHLY_PRICE_ID=
STRIPE_YEARLY_PRICE_ID=
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

6. Click Deploy

## Step 5: Post-Deployment

1. Test login/signup at `/login` and `/signup`
2. Test payment flow at `/pricing`
3. Add sample data in Supabase:
   - Charities
   - Users
   - Test subscriptions
4. Configure Stripe webhook to point to your Vercel URL
5. Test Stripe webhook integration

## Step 6: Configure Domain (Optional)

1. In Vercel project settings
2. Go to Domains
3. Add your custom domain
4. Follow DNS configuration steps

## Monitoring

### Vercel

- Check deployment logs
- Monitor build times
- View analytics

### Supabase

- Check database performance
- Monitor auth logs
- View storage usage

### Stripe

- Monitor webhook logs
- Check payment events
- Review test transactions

## Troubleshooting

### Database Connection Issues

- Verify SUPABASE_SERVICE_ROLE_KEY is correct
- Check Supabase project is active
- Verify RLS policies are enabled

### Stripe Issues

- Verify STRIPE_SECRET_KEY is correct
- Check webhook signing secret
- Verify price IDs exist

### Auth Issues

- Verify NEXT_PUBLIC_SUPABASE_ANON_KEY is correct
- Check Supabase Auth is enabled
- Verify email confirmation settings

## Scaling

For production traffic:

1. **Database**
   - Enable database backups
   - Setup point-in-time recovery
   - Monitor connection pools

2. **Storage**
   - Configure CDN caching for images
   - Set up S3 backup

3. **API**
   - Implement caching
   - Add rate limiting
   - Monitor response times

4. **Analytics**
   - Setup Google Analytics
   - Monitor user behavior
   - Track conversion rates

## Maintenance

### Regular Tasks

- Monitor server logs
- Review failed transactions
- Update dependencies monthly
- Backup database regularly

### Security

- Rotate API keys quarterly
- Review RLS policies
- Monitor for suspicious activities
- Keep dependencies updated

## Support

For deployment issues:

1. Check Vercel dashboard logs
2. Review Supabase dashboard
3. Check Stripe webhook logs
4. Contact support teams

---

Your Golf Charity Platform is now live! 🎉⛳
