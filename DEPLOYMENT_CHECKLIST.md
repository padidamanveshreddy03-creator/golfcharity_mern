# Production Deployment Checklist

## 🔒 Security

- [ ] All environment variables set in Vercel
- [ ] STRIPE_SECRET_KEY never exposed to client
- [ ] Row-Level Security (RLS) enabled on all tables
- [ ] API routes validate user authorization
- [ ] CORS configured for your domain
- [ ] HTTPS enforced

## 🗄️ Database

- [ ] Supabase project created
- [ ] All migrations applied
- [ ] Storage buckets created:
  - [ ] `winnings-proof`
- [ ] Backups configured
- [ ] Connection limits increased (if needed)

## 💳 Stripe

- [ ] Live Stripe account created (or test mode documented)
- [ ] Products created:
  - [ ] Monthly $9.99
  - [ ] Yearly $99.99
- [ ] Webhook configured to production URL
- [ ] STRIPE_WEBHOOK_SECRET saved
- [ ] Tax rates configured (if needed)
- [ ] Email receipts enabled

## 🌐 Deployment (Vercel)

- [ ] GitHub repository created
- [ ] Vercel project created
- [ ] Environment variables added to Vercel dashboard
- [ ] Build successful
- [ ] Deployment successful
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active

## 📧 Email (Optional)

- [ ] Email service configured (Resend, SendGrid, etc)
- [ ] Confirmation emails working
- [ ] Winner notification emails working
- [ ] Admin alerts configured

## 📊 Monitoring

- [ ] Vercel deployment monitoring active
- [ ] Supabase uptime alerts configured
- [ ] Stripe webhook failure alerts set
- [ ] Error tracking configured (Sentry, etc)
- [ ] Analytics configured (Google Analytics, etc)

## 🗂️ Data

- [ ] Sample charities added to database
- [ ] Admin user created
- [ ] Initial admin user verified
- [ ] Backup procedures documented

## 🔗 DNS & Domain

- [ ] Domain registered (if using custom)
- [ ] DNS records pointing to Vercel
- [ ] SSL certificate active
- [ ] Email records configured (SPF, DKIM, etc) if using custom email

## 🧪 Testing

- [ ] Homepage loads
- [ ] Signup works
- [ ] Email confirmation works (if enabled)
- [ ] Login works
- [ ] Dashboard loads
- [ ] Score entry works
- [ ] Pricing page loads
- [ ] Stripe checkout works
- [ ] Webhook processes correctly
- [ ] Admin panel accessible
- [ ] Draw creation works
- [ ] Winner verification works

## 📱 Mobile

- [ ] Responsive design tested on mobile
- [ ] Touch interactions work
- [ ] Forms are usable on small screens
- [ ] Images load correctly

## ♿ Accessibility

- [ ] All buttons have labels
- [ ] Form inputs have labels
- [ ] Color contrast meets WCAG
- [ ] Keyboard navigation works
- [ ] Screen reader compatible

## 📋 Documentation

- [ ] README.md updated
- [ ] API documentation added
- [ ] Deployment guide created
- [ ] Troubleshooting guide created
- [ ] Admin user guide created

## 💰 Cost Management

- [ ] Supabase plan chosen
- [ ] Stripe transaction fees understood
- [ ] Vercel plan chosen
- [ ] Storage limits monitored
- [ ] Bandwidth limits monitored

## 🔄 Ongoing Maintenance

- [ ] Weekly backup schedule
- [ ] Monthly security audit
- [ ] Dependency updates planned
- [ ] Performance optimization plan
- [ ] Scaling plan documented

## 🚨 Incident Response

- [ ] Error monitoring configured
- [ ] Alerting thresholds set
- [ ] On-call schedule (if team)
- [ ] Rollback plan documented
- [ ] Catastrophic failure plan

## 📞 Support

- [ ] Support email configured
- [ ] Bug reporting process
- [ ] Feature request process
- [ ] User documentation link

---

✅ Once all items are checked, your platform is ready for production!

💡 **Pro Tip**: Create a staging environment before going live to test features safely.
