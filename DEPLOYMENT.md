# Deployment Guide - Electricity Tokens Tracker

## 🚀 Vercel Deployment (Recommended)

### Prerequisites

1. **GitHub Repository**: Ensure your code is pushed to GitHub
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
3. **PostgreSQL Database**: Set up a production database (recommended providers below)

### Recommended Database Providers

#### Option 1: Vercel Postgres (Easiest)

- Go to [vercel.com/dashboard](https://vercel.com/dashboard)
- Create a new Postgres database
- Copy the connection string for `DATABASE_URL`

#### Option 2: Supabase (Free tier available)

- Sign up at [supabase.com](https://supabase.com)
- Create a new project
- Go to Settings → Database → Connection string
- Use the connection pooling URL for better performance

#### Option 3: Railway (Simple setup)

- Sign up at [railway.app](https://railway.app)
- Add a PostgreSQL service
- Copy the connection string

### Step-by-Step Deployment

#### 1. Connect GitHub Repository

```bash
# Push your code to GitHub first
git add .
git commit -m "Ready for production deployment"
git push origin main
```

#### 2. Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Configure build settings:
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

#### 3. Configure Environment Variables

In Vercel dashboard → Settings → Environment Variables, add:

**Required Variables:**

```
DATABASE_URL=postgresql://username:password@host:5432/electricity_tokens_prod?sslmode=require
NEXTAUTH_URL=https://your-app-name.vercel.app
NEXTAUTH_SECRET=your-32-character-secret-here
```

**Security Variables:**

```
CSRF_SECRET=your-csrf-secret-32-chars
ENCRYPTION_KEY=your-encryption-key-32-chars
RATE_LIMIT_SECRET=your-rate-limit-secret
```

**App Configuration:**

```
NODE_ENV=production
APP_NAME=Electricity Tokens Tracker
ADMIN_EMAIL=admin@yourdomain.com
```

#### 4. Deploy Database Schema

After first deployment, run database migrations:

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link your project
vercel link

# Run database setup (one time only)
vercel env pull .env.local
npx prisma db push
npx prisma generate
```

#### 5. Create Admin User

After deployment, create your first admin user:

```bash
# Using the web interface (recommended)
# Visit: https://your-app.vercel.app/auth/register
# Register with your admin email
# Then promote to admin in database or via script

# Or via database query
# Connect to your production database and run:
# UPDATE users SET role = 'ADMIN' WHERE email = 'your-admin@email.com';
```

### Post-Deployment Checklist

- [ ] Health check works: `https://your-app.vercel.app/healthz`
- [ ] Admin user created and can login
- [ ] Database schema deployed correctly
- [ ] All environment variables configured
- [ ] HTTPS redirects working
- [ ] PWA functionality works on mobile
- [ ] Error pages display correctly

## 🔒 Security Configuration

### SSL/TLS

- Vercel automatically provides SSL certificates
- Force HTTPS redirects are configured in `vercel.json`

### Security Headers

Security headers are configured in:

- `next.config.js` (application level)
- `vercel.json` (deployment level)

### Database Security

- Always use connection pooling in production
- Enable SSL mode (`sslmode=require`)
- Use strong passwords and rotate regularly

## 📊 Monitoring Setup

### Health Monitoring

- Health endpoint: `/healthz`
- Monitor database connectivity
- Check environment variables

### Performance Monitoring

```bash
# Install Vercel Analytics (optional)
npm install @vercel/analytics
```

Add to your `_app.tsx`:

```tsx
import { Analytics } from '@vercel/analytics/react';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Analytics />
    </>
  );
}
```

## 🔄 Continuous Deployment

### Automatic Deployments

- Production: Deploys automatically from `main` branch
- Preview: Deploys automatically from pull requests

### Branch Strategy

```
main → Production deployment
develop → Preview deployment
feature/* → Preview deployment on PR
```

## 🛠 Troubleshooting

### Common Issues

#### Database Connection Errors

```bash
# Check environment variables
vercel env ls

# Test database connection
npx prisma db push --preview-feature
```

#### Build Failures

```bash
# Check build logs in Vercel dashboard
# Common issues:
# - Missing environment variables
# - TypeScript errors
# - Missing dependencies
```

#### Performance Issues

```bash
# Check function execution time
# API routes should complete within 30 seconds
# Consider database query optimization
```

### Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Prisma Production Guide](https://www.prisma.io/docs/guides/deployment/production)

## 🔧 Advanced Configuration

### Custom Domain

1. Add domain in Vercel dashboard
2. Configure DNS records
3. Update `NEXTAUTH_URL` environment variable

### Database Backups

Set up automated backups with your database provider:

- Vercel Postgres: Automatic backups included
- Supabase: Configure backup schedule
- Railway: Enable automatic backups

### Error Tracking

Consider adding Sentry for error tracking:

```bash
npm install @sentry/nextjs
```

## 📈 Scaling Considerations

### Performance Optimization

- Enable Vercel Edge Functions for global distribution
- Use Vercel KV for session storage (high traffic)
- Implement Redis caching for reports

### Database Optimization

- Connection pooling (already configured)
- Read replicas for reporting queries
- Database indexing for frequently queried columns

---

**Need Help?** Check the health endpoint first: `https://your-app.vercel.app/healthz`
