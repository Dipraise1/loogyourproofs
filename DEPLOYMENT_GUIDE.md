# Production Deployment Guide for SolGigs

## Prerequisites

1. **Supabase Project**: Set up your Supabase project and get credentials
2. **Vercel Account**: For hosting the Next.js application
3. **Domain**: Optional custom domain for your application

## Step 1: Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Run the SQL schema from `SUPABASE_SETUP.md` in your Supabase SQL Editor
3. Get your project URL and anon key from Settings > API
4. Set up Row Level Security policies as specified in the setup guide

## Step 2: Environment Variables

Create a `.env.local` file with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: IPFS Configuration (if you want to keep IPFS as backup)
NEXT_PUBLIC_PINATA_JWT=your_pinata_jwt_token
NEXT_PUBLIC_PINATA_API_KEY=your_pinata_api_key
NEXT_PUBLIC_PINATA_SECRET=your_pinata_secret

# Optional: Blockchain Configuration
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_ETHEREUM_NETWORK=goerli
```

## Step 3: Deploy to Vercel

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel --prod
   ```

4. **Set Environment Variables in Vercel Dashboard**:
   - Go to your project in Vercel dashboard
   - Navigate to Settings > Environment Variables
   - Add all the environment variables from your `.env.local`

## Step 4: Configure Custom Domain (Optional)

1. In Vercel dashboard, go to Settings > Domains
2. Add your custom domain
3. Configure DNS records as instructed by Vercel
4. Update your `next.config.js` if needed for domain-specific configurations

## Step 5: Production Optimizations

### Performance Optimizations

1. **Enable Image Optimization**:
   ```javascript
   // next.config.js
   module.exports = {
     images: {
       domains: ['gateway.pinata.cloud', 'ipfs.io'],
       formats: ['image/webp', 'image/avif'],
     },
   }
   ```

2. **Enable Compression**:
   ```javascript
   // next.config.js
   module.exports = {
     compress: true,
   }
   ```

3. **Optimize Bundle Size**:
   - Use dynamic imports for heavy components
   - Implement code splitting
   - Use Next.js Image component for images

### Security Considerations

1. **Environment Variables**:
   - Never commit `.env.local` to version control
   - Use Vercel's environment variable system for production
   - Rotate API keys regularly

2. **CORS Configuration**:
   - Configure Supabase CORS settings
   - Set up proper domain restrictions

3. **Rate Limiting**:
   - Implement rate limiting for API calls
   - Use Supabase's built-in rate limiting

## Step 6: Monitoring and Analytics

1. **Vercel Analytics**:
   - Already included in the project
   - Provides performance metrics and user analytics

2. **Error Monitoring**:
   - Consider adding Sentry for error tracking
   - Monitor Supabase logs for database issues

3. **Uptime Monitoring**:
   - Set up uptime monitoring with services like UptimeRobot
   - Monitor API response times

## Step 7: Testing Production

1. **Functional Testing**:
   - Test wallet connections (Phantom, MetaMask)
   - Test task creation and application flow
   - Test user profile management
   - Test all CRUD operations

2. **Performance Testing**:
   - Test page load times
   - Test database query performance
   - Test with multiple concurrent users

3. **Security Testing**:
   - Test authentication flows
   - Test data validation
   - Test against common vulnerabilities

## Step 8: Launch Checklist

- [ ] Supabase database schema deployed
- [ ] Environment variables configured
- [ ] Application deployed to Vercel
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active
- [ ] Analytics tracking working
- [ ] Error monitoring set up
- [ ] Performance optimizations applied
- [ ] Security measures in place
- [ ] All features tested in production
- [ ] Documentation updated
- [ ] Team trained on production deployment

## Post-Launch

1. **Monitor Performance**:
   - Check Vercel analytics dashboard
   - Monitor Supabase usage and performance
   - Watch for any error spikes

2. **User Feedback**:
   - Set up feedback collection system
   - Monitor user behavior and pain points
   - Iterate based on real usage data

3. **Scaling Considerations**:
   - Monitor database performance
   - Consider implementing caching strategies
   - Plan for increased user load

## Troubleshooting

### Common Issues

1. **Environment Variables Not Loading**:
   - Check Vercel environment variable configuration
   - Ensure variables are prefixed with `NEXT_PUBLIC_` for client-side access
   - Redeploy after adding new environment variables

2. **Database Connection Issues**:
   - Verify Supabase URL and keys
   - Check RLS policies
   - Monitor Supabase logs

3. **Wallet Connection Issues**:
   - Test with different browsers
   - Check browser extension compatibility
   - Verify network configurations

4. **Performance Issues**:
   - Use Vercel's performance insights
   - Optimize database queries
   - Implement proper caching

### Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Solana Wallet Adapter](https://github.com/solana-labs/wallet-adapter)

## Maintenance

1. **Regular Updates**:
   - Keep dependencies updated
   - Monitor security advisories
   - Update Supabase and Vercel configurations

2. **Backup Strategy**:
   - Supabase provides automatic backups
   - Consider additional backup solutions for critical data
   - Test restore procedures regularly

3. **Monitoring**:
   - Set up alerts for critical issues
   - Monitor application performance
   - Track user engagement metrics
