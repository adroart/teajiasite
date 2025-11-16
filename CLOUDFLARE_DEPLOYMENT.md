# Cloudflare Pages Deployment Guide for Teajia

This document provides step-by-step instructions for deploying the Teajia Premium Tea Collection website to Cloudflare Pages.

## Overview

Teajia is a static HTML/CSS/JavaScript website that fetches tea data from Google Sheets. It requires no build process and is optimized for Cloudflare Pages deployment.

## Prerequisites

1. A Cloudflare account (free tier is sufficient)
2. Git repository access (GitHub, GitLab, or Bitbucket)
3. Node.js 18+ (optional, for local development)

## Deployment Methods

### Method 1: GitHub Integration (Recommended)

This is the easiest method and provides automatic deployments on every push.

#### Steps:

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for Cloudflare Pages deployment"
   git push origin main
   ```

2. **Connect to Cloudflare Pages**
   - Log in to your [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Navigate to **Workers & Pages** → **Pages**
   - Click **Create a project**
   - Click **Connect to Git**
   - Select your GitHub account and repository

3. **Configure Build Settings**
   - **Production branch**: `main` (or your default branch)
   - **Framework preset**: None (or select "None/Static")
   - **Build command**: `npm run build` (or leave empty)
   - **Build output directory**: `/` (root directory)
   - **Root directory**: `/` (leave empty)

4. **Environment Variables** (Optional)
   - No environment variables are required for basic deployment
   - Add any custom variables if needed in the future

5. **Deploy**
   - Click **Save and Deploy**
   - Cloudflare will build and deploy your site
   - Your site will be available at `https://teajia.pages.dev`

6. **Custom Domain** (Optional)
   - Go to your project's **Custom domains** tab
   - Click **Set up a custom domain**
   - Follow the DNS configuration instructions

### Method 2: Wrangler CLI

Use this method for manual deployments via command line.

#### Steps:

1. **Install Wrangler**
   ```bash
   npm install -g wrangler
   ```

2. **Authenticate with Cloudflare**
   ```bash
   wrangler login
   ```

3. **Deploy**
   ```bash
   npm run deploy
   ```

   Or directly:
   ```bash
   wrangler pages deploy . --project-name=teajia
   ```

4. **First-time Setup**
   - On first deployment, Wrangler will ask you to create a new project
   - Follow the prompts to configure your project
   - Subsequent deployments will update the existing project

### Method 3: Direct Upload (Drag & Drop)

Quick method for testing, but not recommended for production.

1. Create a ZIP file of your project (excluding node_modules, .git)
2. Go to Cloudflare Pages → Create a project
3. Select **Upload assets**
4. Drag and drop your ZIP file

## Build Configuration Details

### Build Settings for Cloudflare Dashboard

```
Framework preset: None
Build command: npm run build
Build output directory: /
Root directory: (empty)
Node version: 18
```

### Environment Variables

No environment variables are currently required. The site fetches data directly from a public Google Sheets CSV.

## Key Files for Cloudflare Pages

### `_headers`
Configures HTTP headers for security, caching, and CORS.
- Security headers (CSP, X-Frame-Options, etc.)
- Cache-Control directives for optimal performance
- CORS configuration for fonts and external resources

### `_redirects`
Handles URL redirects and rewrites.
- Currently configured for basic redirects
- Can be extended for custom routing

### `robots.txt`
SEO configuration for search engine crawlers.

### `wrangler.toml`
Configuration for Wrangler CLI deployments.

### `.node-version`
Specifies Node.js version (18.17.0) for build environment.

## Post-Deployment Checklist

- [ ] Verify site loads correctly at your Cloudflare Pages URL
- [ ] Test all functionality (filters, search, modal, etc.)
- [ ] Verify Google Sheets data is loading properly
- [ ] Check browser console for any errors
- [ ] Test on mobile devices
- [ ] Set up custom domain (optional)
- [ ] Configure analytics (optional)
- [ ] Update robots.txt sitemap URL with your production domain

## Performance Optimization

Cloudflare Pages provides:
- **Global CDN**: Your site is served from 275+ data centers worldwide
- **HTTP/3 Support**: Automatic QUIC protocol support
- **Brotli Compression**: Automatic compression for faster load times
- **Automatic HTTPS**: Free SSL/TLS certificates
- **DDoS Protection**: Enterprise-grade security
- **Smart Caching**: Edge caching with instant purge

## Branch Deployments

Cloudflare Pages automatically creates preview deployments for every branch:
- **Production**: Deployed from `main` branch → `teajia.pages.dev`
- **Preview**: Any other branch → `branch-name.teajia.pages.dev`

This allows you to test changes before merging to production.

## Rollbacks

To rollback to a previous deployment:
1. Go to your project in Cloudflare Pages
2. Click on the **Deployments** tab
3. Find the deployment you want to rollback to
4. Click **···** → **Rollback to this deployment**

## Troubleshooting

### Site not loading
- Check build logs in Cloudflare dashboard
- Verify build output directory is set to `/`
- Ensure all files are committed to git

### Google Sheets data not loading
- Check browser console for CORS errors
- Verify the Google Sheets URL in `scripts/app.js`
- Ensure the sheet is publicly accessible

### 404 errors
- Verify `_redirects` file is in the root directory
- Check that file paths in HTML are relative or absolute correctly

### Security headers causing issues
- Review `_headers` file
- Adjust CSP directives if needed for additional third-party resources

## Local Development

```bash
# Install dependencies
npm install

# Run local development server
npm run dev

# Test with Cloudflare Pages emulation (requires Wrangler)
npm run cf:dev
```

## Additional Resources

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)
- [Cloudflare Pages Headers](https://developers.cloudflare.com/pages/platform/headers/)
- [Cloudflare Pages Redirects](https://developers.cloudflare.com/pages/platform/redirects/)

## Support

For issues specific to Cloudflare Pages deployment, consult:
- [Cloudflare Community](https://community.cloudflare.com/)
- [Cloudflare Discord](https://discord.gg/cloudflaredev)
- [Cloudflare Support](https://support.cloudflare.com/)

---

**Last Updated**: November 2024
**Project**: Teajia Premium Tea Collection
**Deployment Target**: Cloudflare Pages
